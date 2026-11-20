import type { CatalogChannel } from '../../shared/channels/types';
import type { Report, ReportInput } from '../../shared/reports';
import type { FoundLink } from '../../shared/streamLinks';

const configuredUrl: string | undefined = import.meta.env.VITE_API_URL;

/** Base address of the Worker API, or null when the site is built without one. */
export const API_URL = configuredUrl ? configuredUrl.replace(/\/+$/, '') : null;

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

async function request<T>(
  path: string,
  { method = 'GET', body, token, cache }: RequestOptions = {},
) {
  if (!API_URL) throw new ApiError(0, 'The API is not configured');

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data ? String(data.error) : '';
    throw new ApiError(response.status, message || `HTTP ${response.status}`);
  }
  return data as T;
}

/** The list saved in the admin area (unvalidated; null when none) and the site version it was saved on. */
export interface RemoteChannels {
  channels: unknown;
  appVersion: unknown;
}

/**
 * The remotely managed channel list. `fresh` skips the browser's one-minute copy: the
 * admin area must never edit a stale list.
 */
export async function fetchRemoteChannels({ fresh = false } = {}): Promise<RemoteChannels> {
  const options: RequestOptions = fresh ? { cache: 'no-cache' } : {};
  const { channels, appVersion } = await request<RemoteChannels>('/channels', options);
  return { channels, appVersion };
}

export async function submitReport(report: ReportInput) {
  await request('/reports', { method: 'POST', body: report });
}

export async function login(password: string) {
  return (await request<{ token: string }>('/admin/login', { method: 'POST', body: { password } }))
    .token;
}

export async function saveChannels(token: string, channels: readonly CatalogChannel[]) {
  const body = { channels, appVersion: __APP_VERSION__ };
  await request('/admin/channels', { method: 'PUT', body, token });
}

export async function fetchReports(token: string) {
  return (await request<{ reports: Report[] }>('/admin/reports', { token })).reports;
}

export async function deleteReport(token: string, reportId: string) {
  const path = `/admin/reports/${encodeURIComponent(reportId)}`;
  return (await request<{ reports: Report[] }>(path, { method: 'DELETE', token })).reports;
}

/** How the Worker's real-browser stage went, when the page itself held no link. */
export type BrowserOutcome = 'not-needed' | 'used' | 'unavailable' | 'limit-reached' | 'failed';

export interface ExtractedLinks {
  links: FoundLink[];
  pagesScanned: number;
  browser: BrowserOutcome;
}

/** Asks the Worker to find stream links on a web page (and the players it embeds). */
export async function extractStreamLinks(token: string, url: string) {
  return request<ExtractedLinks>('/admin/extract', { method: 'POST', body: { url }, token });
}
