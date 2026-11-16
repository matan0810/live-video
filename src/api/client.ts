import type { CatalogChannel } from '../../shared/channels/types';
import type { Report, ReportInput } from '../../shared/reports';

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
}

async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}) {
  if (!API_URL) throw new ApiError(0, 'The API is not configured');

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data ? String(data.error) : '';
    throw new ApiError(response.status, message || `HTTP ${response.status}`);
  }
  return data as T;
}

/** The remotely managed channel list, unvalidated; null when none has been saved. */
export async function fetchRemoteChannels(): Promise<unknown> {
  return (await request<{ channels: unknown }>('/channels')).channels;
}

export async function submitReport(report: ReportInput) {
  await request('/reports', { method: 'POST', body: report });
}

export async function login(password: string) {
  return (await request<{ token: string }>('/admin/login', { method: 'POST', body: { password } }))
    .token;
}

export async function saveChannels(token: string, channels: readonly CatalogChannel[]) {
  await request('/admin/channels', { method: 'PUT', body: channels, token });
}

export async function fetchReports(token: string) {
  return (await request<{ reports: Report[] }>('/admin/reports', { token })).reports;
}

export async function deleteReport(token: string, reportId: string) {
  const path = `/admin/reports/${encodeURIComponent(reportId)}`;
  return (await request<{ reports: Report[] }>(path, { method: 'DELETE', token })).reports;
}
