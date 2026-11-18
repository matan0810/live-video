import { parseChannels } from '../../shared/channels/parseChannels';
import { isHttpsUrl } from '../../shared/channels/url';
import { parseReportInput, type Report } from '../../shared/reports';
import { findIframes, findStreamLinks } from '../../shared/streamLinks';
import { createSessionToken, isCorrectPassword, requireAdmin } from './auth';
import { KV_KEYS, type Env } from './env';
import { corsHeaders, HttpError, json, readJson } from './http';
import { enforceRateLimit } from './rateLimit';

const MAX_REPORTS = 200;
const MAX_REPORT_BYTES = 4 * 1024;
const MAX_CHANNELS_BYTES = 256 * 1024;
const MAX_LOGIN_BYTES = 1024;

const LOGIN_LIMIT = { scope: 'login', maxRequests: 5, windowSeconds: 15 * 60 };
const REPORT_LIMIT = { scope: 'report', maxRequests: 10, windowSeconds: 60 * 60 };
const EXTRACT_LIMIT = { scope: 'extract', maxRequests: 30, windowSeconds: 60 * 60 };
const MAX_EXTRACT_BYTES = 1024;
const MAX_PAGE_CHARS = 2 * 1024 * 1024;
const MAX_IFRAMES = 3;
const PAGE_TIMEOUT_MS = 10_000;
const PAGE_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; OnAir link finder)' };

async function readReports(env: Env): Promise<Report[]> {
  return (await env.KV.get<Report[]>(KV_KEYS.reports, 'json')) ?? [];
}

async function getChannels(env: Env) {
  const channels = await env.KV.get(KV_KEYS.channels, 'json');
  // Null tells the site to keep using the list it was built with.
  return json({ channels }, 200, { 'Cache-Control': 'public, max-age=60' });
}

async function saveChannels(request: Request, env: Env) {
  await requireAdmin(request, env);
  const body = await readJson(request, MAX_CHANNELS_BYTES);
  let channels;
  try {
    channels = parseChannels(body);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : 'Invalid channel list');
  }

  const previous = await env.KV.get(KV_KEYS.channels);
  if (previous) await env.KV.put(KV_KEYS.previousChannels, previous);
  await env.KV.put(KV_KEYS.channels, JSON.stringify(channels));
  return json({ channels });
}

async function login(request: Request, env: Env) {
  await enforceRateLimit(request, env, LOGIN_LIMIT);
  const body = await readJson(request, MAX_LOGIN_BYTES);
  const password = typeof body === 'object' && body !== null && 'password' in body && body.password;
  if (!(await isCorrectPassword(env, password))) throw new HttpError(401, 'Wrong password');
  return json({ token: await createSessionToken(env) });
}

async function createReport(request: Request, env: Env) {
  await enforceRateLimit(request, env, REPORT_LIMIT);
  const input = parseReportInput(await readJson(request, MAX_REPORT_BYTES));
  if (!input) throw new HttpError(400, 'Invalid report');

  const report: Report = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const reports = [report, ...(await readReports(env))].slice(0, MAX_REPORTS);
  await env.KV.put(KV_KEYS.reports, JSON.stringify(reports));
  return json({ ok: true }, 201);
}

async function listReports(request: Request, env: Env) {
  await requireAdmin(request, env);
  return json({ reports: await readReports(env) });
}

async function deleteReport(request: Request, env: Env, reportId: string) {
  await requireAdmin(request, env);
  const reports = (await readReports(env)).filter((report) => report.id !== reportId);
  await env.KV.put(KV_KEYS.reports, JSON.stringify(reports));
  return json({ reports });
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

/**
 * Finds stream links on a web page and in the players it embeds (one level of iframes).
 * Only links present in the page source are found: a player that builds the address at
 * run time from a separate request will not show one.
 */
async function extractStreams(request: Request, env: Env) {
  await requireAdmin(request, env);
  await enforceRateLimit(request, env, EXTRACT_LIMIT);
  const body = await readJson(request, MAX_EXTRACT_BYTES);
  const url = typeof body === 'object' && body !== null && 'url' in body ? body.url : null;
  if (!isHttpsUrl(url)) throw new HttpError(400, 'The page address must be an https URL');

  const page = await fetchPage(url);
  if (page === null) throw new HttpError(502, 'Could not load the page');

  const links = findStreamLinks(page, url);
  const iframes = findIframes(page, url).slice(0, MAX_IFRAMES);
  for (const frame of iframes) {
    const framePage = await fetchPage(frame);
    if (framePage !== null) links.push(...findStreamLinks(framePage, frame));
  }
  return json({ links: [...new Set(links)], pagesScanned: 1 + iframes.length });
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
    return response;
  },
} satisfies ExportedHandler<Env>;
