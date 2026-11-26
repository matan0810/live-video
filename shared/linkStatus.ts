/**
 * What the daily link check found, per channel and link. The check (scripts/check-links.ts)
 * writes it, the Worker keeps the latest run, and the admin area shows it.
 */
import type { StreamProblem } from './streamProblems.ts';
import { isRecord } from './isRecord.ts';

/** limited: watchable, but not everywhere (an HEVC-only stream plays on most devices, not all). */
export type SourceState = 'ok' | 'limited' | 'problems' | 'down' | 'abroad';

/** Problems that leave a stream watchable on most devices. */
export const LIMITATIONS: readonly StreamProblem[] = ['hevc-only'];

export interface SourceResult {
  url: string;
  state: SourceState;
  /** Why it is down, e.g. "HTTP 404". */
  detail: string;
  problems: StreamProblem[];
}

export type ChannelVerdict =
  'ok' | 'partial' | 'limited' | 'problems' | 'down' | 'abroad' | 'no-link';

export interface ChannelResult {
  name: string;
  id: string;
  sources: SourceResult[];
}

export const PROBLEM_TEXT: Record<StreamProblem, string> = {
  'no-audio': 'בלי קול',
  'low-quality': 'איכות נמוכה מ-360p',
  'hevc-only': 'בפורמט HEVC בלבד, שחלק מהדפדפנים לא מנגנים',
  recording: 'הקלטה ולא שידור חי',
  'blocks-site': 'השרת לא מרשה לנגן אותו מהאתר',
};

/**
 * ok: every link works. partial: viewers get a working link, but the first one or a backup
 * is broken. limited: the best link plays on most devices only. problems: links answer but
 * none is watchable. down: nothing answers. abroad: the only failures are hosts that refuse
 * anyone outside Israel, so it is unknown. no-link: kept on the list with no link on purpose.
 */
export function channelVerdict(sources: readonly SourceResult[]): ChannelVerdict {
  if (sources.length === 0) return 'no-link';
  if (sources.every((source) => source.state === 'ok')) return 'ok';
  if (sources.some((source) => source.state === 'ok')) return 'partial';
  if (sources.some((source) => source.state === 'limited')) return 'limited';
  if (sources.some((source) => source.state === 'problems')) return 'problems';
  if (sources.every((source) => source.state === 'abroad')) return 'abroad';
  return 'down';
}

/** What is wrong with a link, in Hebrew, for the owner. */
export function describeSourceProblem(source: SourceResult): string {
  if (source.state === 'ok') return 'תקין';
  if (source.state === 'problems' || source.state === 'limited') {
    return source.problems.map((problem) => PROBLEM_TEXT[problem]).join(', ');
  }
  if (source.state === 'abroad') return 'חסום מחוץ לישראל';
  return `לא עונה (${source.detail})`;
}

/** The latest run of the daily check, as stored in the Worker's KV. */
export interface LinkStatus {
  /** ISO time of the run. */
  checkedAt: string;
  /** Which list was checked, in Hebrew (the admin's list or the code's). */
  from: string;
  channels: ChannelResult[];
}

const MAX_TEXT = 500;
const SOURCE_STATES: readonly SourceState[] = ['ok', 'limited', 'problems', 'down', 'abroad'];
const PROBLEMS = Object.keys(PROBLEM_TEXT);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= MAX_TEXT;
const isSourceState = (value: unknown): value is SourceState =>
  SOURCE_STATES.some((state) => state === value);
const isProblem = (value: unknown): value is StreamProblem =>
  PROBLEMS.some((problem) => problem === value);

function parseSource(raw: unknown): SourceResult | null {
  if (!isRecord(raw) || !isText(raw.url) || !isSourceState(raw.state) || !isText(raw.detail)) {
    return null;
  }
  if (!Array.isArray(raw.problems) || !raw.problems.every(isProblem)) return null;
  return { url: raw.url, state: raw.state, detail: raw.detail, problems: raw.problems };
}

function parseChannel(raw: unknown): ChannelResult | null {
  if (!isRecord(raw) || !isText(raw.id) || !isText(raw.name) || !Array.isArray(raw.sources)) {
    return null;
  }
  const sources = raw.sources.map(parseSource);
  if (!sources.every((source) => source !== null)) return null;
  return { id: raw.id, name: raw.name, sources };
}

/** Reads a stored run, or null when there is none or it is not well formed. */
export function parseLinkStatus(raw: unknown): LinkStatus | null {
  if (!isRecord(raw) || !isText(raw.from) || !Array.isArray(raw.channels)) return null;
  if (typeof raw.checkedAt !== 'string' || Number.isNaN(Date.parse(raw.checkedAt))) return null;
  const channels = raw.channels.map(parseChannel);
  if (!channels.every((channel) => channel !== null)) return null;
  return { checkedAt: raw.checkedAt, from: raw.from, channels };
}
