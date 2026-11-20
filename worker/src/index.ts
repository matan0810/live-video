import { isVersion } from '../../shared/channels/listVersion';
import { parseChannels } from '../../shared/channels/parseChannels';
import { isHttpsUrl } from '../../shared/channels/url';
import { parseReportInput } from '../../shared/reports';
import { findIframes, findStreamLinks, type FoundLink } from '../../shared/streamLinks';
import { captureStreamRequests } from './browserCapture';
import { startCloudflareSession } from './cloudflareBrowser';
import { createSessionToken, isCorrectPassword, requireAdmin } from './auth';
import { KV_KEYS, type Env } from './env';
import { corsHeaders, HttpError, json, readJson } from './http';
import { enforceBurstLimit, enforceWindowLimit } from './rateLimit';
import { addReport, isReportId, listReports as readReports, removeReport } from './reports';

const MAX_REPORT_BYTES = 4 * 1024;
const MAX_CHANNELS_BYTES = 256 * 1024;
const MAX_LOGIN_BYTES = 1024;

/** On top of the per-minute limit, which alone would allow too many password guesses. */
const LOGIN_LIMIT = { scope: 'login', maxRequests: 5, windowSeconds: 15 * 60 };
/** The free plan allows 10 browser minutes a day; at ~25 s a search this keeps well inside it. */
const BROWSER_LIMIT = { scope: 'browser', maxRequests: 15, windowSeconds: 24 * 60 * 60 };
const MAX_EXTRACT_BYTES = 1024;
const MAX_PAGE_CHARS = 2 * 1024 * 1024;
const MAX_IFRAMES = 3;
const PAGE_TIMEOUT_MS = 10_000;
const PAGE_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; OnAir link finder)' };

async function getChannels(env: Env) {
  const [channels, appVersion] = await Promise.all([
    env.KV.get(KV_KEYS.channels, 'json'),
    env.KV.get(KV_KEYS.channelsVersion),
  ]);
  // Null channels tell the site to keep the list it was built with; the version tells it
  // whether this list is newer than that one (see shared/channels/listVersion.ts).
  return json({ channels, appVersion: isVersion(appVersion) ? appVersion : null }, 200, {
    'Cache-Control': 'public, max-age=60',
  });
}

async function saveChannels(request: Request, env: Env) {
  await requireAdmin(request, env);
  const body = await readJson(request, MAX_CHANNELS_BYTES);
  // Sites before 2.7.1 send the bare list; newer ones add the version they run.
  const isWrapped = typeof body === 'object' && body !== null && !Array.isArray(body);
  const list = isWrapped && 'channels' in body ? body.channels : body;
  const appVersion = isWrapped && 'appVersion' in body ? body.appVersion : null;
  if (appVersion !== null && !isVersion(appVersion)) throw new HttpError(400, 'Invalid version');
  let channels;
  try {
    channels = parseChannels(list);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : 'Invalid channel list');
  }

  const previous = await env.KV.get(KV_KEYS.channels);
  if (previous) await env.KV.put(KV_KEYS.previousChannels, previous);
  await env.KV.put(KV_KEYS.channels, JSON.stringify(channels));
  if (appVersion === null) await env.KV.delete(KV_KEYS.channelsVersion);
  else await env.KV.put(KV_KEYS.channelsVersion, appVersion);
  return json({ channels, appVersion });
}

async function login(request: Request, env: Env) {
  await enforceBurstLimit(request, env, env.LOGIN_LIMITER, 'login');
  await enforceWindowLimit(request, env, LOGIN_LIMIT);
  const body = await readJson(request, MAX_LOGIN_BYTES);
  const password = typeof body === 'object' && body !== null && 'password' in body && body.password;
  if (!(await isCorrectPassword(env, password))) throw new HttpError(401, 'Wrong password');
  return json({ token: await createSessionToken(env) });
}

async function createReport(request: Request, env: Env) {
  await enforceBurstLimit(request, env, env.REPORT_LIMITER, 'report');
  const input = parseReportInput(await readJson(request, MAX_REPORT_BYTES));
  if (!input) throw new HttpError(400, 'Invalid report');
  await addReport(env, input);
  return json({ ok: true }, 201);
}

async function listReports(request: Request, env: Env) {
  await requireAdmin(request, env);
  return json({ reports: await readReports(env) });
}

async function deleteReport(request: Request, env: Env, reportId: string) {
  await requireAdmin(request, env);
  if (!isReportId(reportId)) throw new HttpError(404, 'Not found');
  return json({ reports: await removeReport(env, reportId) });
}

/** Downloads a page as text, giving up on slow pages and cutting oversized ones. */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: PAGE_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return (await response.text()).slice(0, MAX_PAGE_CHARS);
  } catch {
    return null;
  }
}

type BrowserOutcome = 'not-needed' | 'used' | 'unavailable' | 'limit-reached' | 'failed';

/** Opens the page in a real browser and records the playlists its player requests. */
async function captureWithBrowser(
  request: Request,
  env: Env,
  url: string,
): Promise<{ links: FoundLink[]; outcome: BrowserOutcome }> {
  const binding = env.BROWSER;
  if (!binding) return { links: [], outcome: 'unavailable' };
  try {
    await enforceWindowLimit(request, env, BROWSER_LIMIT);
  } catch {
    return { links: [], outcome: 'limit-reached' };
  }
  try {
    const urls = await captureStreamRequests(() => startCloudflareSession(binding), url);
    return { links: urls.map((link) => ({ url: link, source: 'browser' })), outcome: 'used' };
  } catch (error) {
    console.error('Browser capture failed', error);
    return { links: [], outcome: 'failed' };
  }
}

/**
 * Finds stream links for a channel's web page, in stages, stopping at the first that finds
 * something: the page source, then the players it embeds (one level of iframes), then a
 * real browser that plays the page and records what the player requests.
 */
async function extractStreams(request: Request, env: Env) {
  await requireAdmin(request, env);
  await enforceBurstLimit(request, env, env.EXTRACT_LIMITER, 'extract');
  const body = await readJson(request, MAX_EXTRACT_BYTES);
  const url = typeof body === 'object' && body !== null && 'url' in body ? body.url : null;
  if (!isHttpsUrl(url)) throw new HttpError(400, 'The page address must be an https URL');

  const page = await fetchPage(url);
  const links: FoundLink[] =
    page === null ? [] : findStreamLinks(page, url).map((link) => ({ url: link, source: 'page' }));
  const iframes = page === null ? [] : findIframes(page, url).slice(0, MAX_IFRAMES);
  for (const frame of iframes) {
    const framePage = await fetchPage(frame);
    if (framePage === null) continue;
    links.push(
      ...findStreamLinks(framePage, frame).map((link) => ({ url: link, source: 'frame' as const })),
    );
  }

  // Pages that block plain requests (page === null) may still open in a real browser.
  let browser: BrowserOutcome = 'not-needed';
  if (links.length === 0) {
    const captured = await captureWithBrowser(request, env, url);
    links.push(...captured.links);
    browser = captured.outcome;
  }
  if (page === null && links.length === 0) throw new HttpError(502, 'Could not load the page');

  const unique = links.filter(
    (link, index) => links.findIndex((other) => other.url === link.url) === index,
  );
  return json({ links: unique, pagesScanned: (page === null ? 0 : 1) + iframes.length, browser });
}

function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const [, first = '', second = '', third = ''] = pathname.split('/');
  const endpoint = `${request.method} /${[first, second].filter(Boolean).join('/')}`;

  if (third === '') {
    switch (endpoint) {
      case 'GET /channels':
        return getChannels(env);
      case 'POST /reports':
        return createReport(request, env);
      case 'POST /admin/login':
        return login(request, env);
      case 'PUT /admin/channels':
        return saveChannels(request, env);
      case 'GET /admin/reports':
        return listReports(request, env);
      case 'POST /admin/extract':
        return extractStreams(request, env);
    }
  }
  if (endpoint === 'DELETE /admin/reports' && third) return deleteReport(request, env, third);

  throw new HttpError(404, 'Not found');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await route(request, env);
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(error);
      response =
        error instanceof HttpError
          ? json({ error: error.message }, error.status)
          : json({ error: 'Internal error' }, 500);
    }

    for (const [name, value] of Object.entries(cors)) response.headers.set(name, value);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Method, path and outcome only: no address, token, query or body is logged.
    console.log(
      `${request.method} ${new URL(request.url).pathname} ${response.status} ${Date.now() - startedAt}ms`,
    );
    return response;
  },
} satisfies ExportedHandler<Env>;
