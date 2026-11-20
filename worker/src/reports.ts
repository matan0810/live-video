import { parseReportInput, type Report, type ReportInput } from '../../shared/reports';
import type { Env } from './env';

/** Reports the admin sees at most, newest first. */
export const MAX_REPORTS = 200;
/** Old reports remove themselves. */
const REPORT_TTL_SECONDS = 90 * 24 * 60 * 60;
const PREFIX = 'report:';
/** Before reports had a key each, they were one list under this key. */
const LEGACY_KEY = 'reports';
/** Newest-first order comes from the key itself: a descending time, then a random part. */
const REPORT_ID = /^\d{13}-[0-9a-f-]{36}$/;
const LATEST_TIME = 9_999_999_999_999;

export function isReportId(value: string) {
  return REPORT_ID.test(value);
}

function newReportId(now: number) {
  return `${String(LATEST_TIME - now).padStart(13, '0')}-${crypto.randomUUID()}`;
}

/** A stored report, checked again on the way out: KV content is never trusted blindly. */
function readStored(value: unknown): Report | null {
  if (typeof value !== 'object' || value === null) return null;
  const id = 'id' in value ? value.id : undefined;
  const createdAt = 'createdAt' in value ? value.createdAt : undefined;
  const input = parseReportInput(value);
  if (!input || typeof id !== 'string' || typeof createdAt !== 'string') return null;
  return { ...input, id, createdAt };
}

async function store(env: Env, report: Report) {
  await env.KV.put(`${PREFIX}${report.id}`, JSON.stringify(report), {
    expirationTtl: REPORT_TTL_SECONDS,
  });
}

/**
 * Each report is its own KV entry, so two reports sent at the same moment cannot
 * overwrite each other, as they could when all reports were one list.
 */
export async function addReport(env: Env, input: ReportInput) {
  const now = Date.now();
  await store(env, { ...input, id: newReportId(now), createdAt: new Date(now).toISOString() });
}

/** Moves reports from the old single list to their own entries, once. */
async function migrateLegacy(env: Env) {
  const legacy = await env.KV.get<unknown[]>(LEGACY_KEY, 'json');
  if (!legacy) return;
  for (const item of Array.isArray(legacy) ? legacy : []) {
    const report = readStored(item);
    if (!report) continue;
    const time = Date.parse(report.createdAt);
    await store(env, { ...report, id: newReportId(Number.isNaN(time) ? Date.now() : time) });
  }
  await env.KV.delete(LEGACY_KEY);
}

export async function listReports(env: Env, without?: string): Promise<Report[]> {
  await migrateLegacy(env);
  const { keys } = await env.KV.list({ prefix: PREFIX, limit: MAX_REPORTS });
  const reports = await Promise.all(
    keys
      // A just-deleted key can still be listed for a while: KV listings lag behind.
      .filter(({ name }) => name !== `${PREFIX}${without}`)
      .map(async ({ name }) => readStored(await env.KV.get(name, 'json'))),
  );
  return reports.filter((report) => report !== null);
}

export async function removeReport(env: Env, reportId: string) {
  await env.KV.delete(`${PREFIX}${reportId}`);
  return listReports(env, reportId);
}
