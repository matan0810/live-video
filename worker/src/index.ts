import { parseChannels } from '../../shared/channels/parseChannels';
import { parseReportInput, type Report } from '../../shared/reports';
import { createSessionToken, isCorrectPassword, requireAdmin } from './auth';
import { KV_KEYS, type Env } from './env';
import { corsHeaders, HttpError, json, readJson } from './http';
import { enforceRateLimit } from './rateLimit';
import { STREAM_RESOLVERS } from './streams';

const MAX_REPORTS = 200;
const MAX_REPORT_BYTES = 4 * 1024;
const MAX_CHANNELS_BYTES = 256 * 1024;
const MAX_LOGIN_BYTES = 1024;

const LOGIN_LIMIT = { scope: 'login', maxRequests: 5, windowSeconds: 15 * 60 };
const REPORT_LIMIT = { scope: 'report', maxRequests: 10, windowSeconds: 60 * 60 };

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

async function redirectToStream(streamId: string) {
  const resolve = STREAM_RESOLVERS[streamId];
  if (!resolve) throw new HttpError(404, 'Unknown stream');
  try {
    return new Response(null, {
      status: 302,
      headers: { Location: await resolve(), 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    throw new HttpError(502, error instanceof Error ? error.message : 'Could not resolve stream');
  }
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
    }
    if (request.method === 'GET' && first === 'stream' && second) return redirectToStream(second);
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
