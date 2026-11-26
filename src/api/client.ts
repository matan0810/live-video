import type { CatalogChannel } from '../../shared/channels/types';
import { parseLinkStatus } from '../../shared/linkStatus';
import { isRecord } from '../../shared/isRecord';
import type { ReportInput } from '../../shared/reports';
import { parseExtractedLinks, parseRemoteChannels, parseReports, parseToken } from './responses';

import type { RemoteChannels } from './responses';
export type { BrowserOutcome, ExtractedLinks, RemoteChannels } from './responses';

const configuredUrl: string | undefined = import.meta.env.VITE_API_URL;

/** Base address of the Worker API, or null when the site is built without one. */
export const API_URL = configuredUrl ? configuredUrl.replace(/\/+$/, '') : null;

/** A request that has not answered by then is given up, so the page never hangs. */
const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  cache?: RequestCache;
}

async function request(path: string, { method = 'GET', body, token, cache }: RequestOptions = {}) {
  if (!API_URL) throw new ApiError(0, 'The API is not configured');

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Status 0: no answer at all (offline, blocked, or the server took too long).
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';
    throw new ApiError(0, isTimeout ? 'timeout' : 'network');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(data) && typeof data.error === 'string' ? data.error : '';
    throw new ApiError(response.status, message || `HTTP ${response.status}`);
  }
  return data;
}

/** An answer of the expected shape, or an error: the shape is checked, never assumed. */
function expect<T>(data: unknown, parse: (data: unknown) => T | null): T {
  const parsed = parse(data);
  if (parsed === null) throw new ApiError(0, 'malformed answer');
  return parsed;
}

/**
 * The remotely managed channel list. `fresh` skips the browser's one-minute copy: the
 * admin area must never edit a stale list.
 */
export async function fetchRemoteChannels({ fresh = false } = {}): Promise<RemoteChannels> {
  const options: RequestOptions = fresh ? { cache: 'no-cache' } : {};
  return expect(await request('/channels', options), parseRemoteChannels);
}

export async function submitReport(report: ReportInput) {
  await request('/reports', { method: 'POST', body: report });
}

export async function login(password: string) {
  return expect(await request('/admin/login', { method: 'POST', body: { password } }), parseToken);
}

export async function saveChannels(token: string, channels: readonly CatalogChannel[]) {
  const body = { channels, appVersion: __APP_VERSION__ };
  await request('/admin/channels', { method: 'PUT', body, token });
}

export async function fetchReports(token: string) {
  return expect(await request('/admin/reports', { token }), parseReports);
}

export async function deleteReport(token: string, reportId: string) {
  const path = `/admin/reports/${encodeURIComponent(reportId)}`;
  return expect(await request(path, { method: 'DELETE', token }), parseReports);
}

/** Asks the Worker to find stream links on a web page (and the players it embeds). */
export async function extractStreamLinks(token: string, url: string) {
  return expect(
    await request('/admin/extract', { method: 'POST', body: { url }, token }),
    parseExtractedLinks,
  );
}

/** The latest daily link check, validated; null before the first run or if malformed. */
export async function fetchLinkStatus(token: string) {
  const data = await request('/admin/link-status', { token });
  return isRecord(data) ? parseLinkStatus(data.status) : null;
}
