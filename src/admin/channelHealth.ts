import {
  PROBLEM_TEXT,
  acknowledgeLimits,
  type LinkStatus,
  type SourceResult,
} from '../../shared/linkStatus';
import { draftSources, type DraftChannel } from './drafts';
import type { StreamCheckState } from './useStreamChecks';

/**
 * How a channel is doing, for the dot beside its name. Four colours, each with one meaning:
 * green works, amber works but with something to know, red does not work (or has no link),
 * grey not checked.
 */
export type Tone = 'good' | 'warn' | 'bad' | 'unknown';

export interface Health {
  tone: Tone;
  text: string;
}

/** One link as best known: from a check just run here, else the daily check. */
type LinkState =
  | { kind: 'ok' }
  | { kind: 'limited'; limits: string }
  /** `isHereOnly`: it answered the daily check, so this may be this browser or place alone. */
  | { kind: 'down'; text: string; isHereOnly: boolean }
  | { kind: 'checking' }
  | { kind: 'unknown' };

const UNKNOWN: Health = { tone: 'unknown', text: 'לא נבדק' };

function describeLimits(source: SourceResult) {
  return source.problems.map((problem) => PROBLEM_TEXT[problem]).join(', ');
}

function linkState(live: StreamCheckState | undefined, daily: SourceResult | undefined): LinkState {
  if (live === 'checking') return { kind: 'checking' };
  const dailyLimited = daily?.state === 'limited';
  if (live) {
    if (live.isWorking) return { kind: 'ok' };
    // A stream with limits (HEVC) may simply not play in the browser that ran the check.
    if (daily && dailyLimited) return { kind: 'limited', limits: describeLimits(daily) };
    // It answered the daily check but not this browser: not the same as dead.
    if (daily?.state === 'ok') {
      return { kind: 'down', text: 'נכשל בבדיקה כאן, תקין בבדיקה היומית', isHereOnly: true };
    }
    return { kind: 'down', text: 'לא עובד', isHereOnly: false };
  }
  if (!daily) return { kind: 'unknown' };
  if (daily.state === 'ok') return { kind: 'ok' };
  if (dailyLimited) return { kind: 'limited', limits: describeLimits(daily) };
  if (daily.state === 'abroad') return { kind: 'unknown' };
  return {
    kind: 'down',
    text: daily.state === 'problems' ? 'אי אפשר לצפות' : 'לא עובד',
    isHereOnly: false,
  };
}

const isUsable = (state: LinkState) => state.kind === 'ok' || state.kind === 'limited';

/**
 * The channel's state as best known: what a check just run from this browser found, else
 * the daily check, if it saw these very links (after an edit it saw something else), with
 * the channel's own tags taken into account.
 */
export function healthOf(
  draft: DraftChannel,
  daily: LinkStatus | null | undefined | 'unavailable',
  checks: ReadonlyMap<string, StreamCheckState>,
): Health {
  const urls = draftSources(draft);
  if (urls.length === 0) return { tone: 'bad', text: 'בלי קישור' };

  const result =
    daily && daily !== 'unavailable' ? daily.channels.find((c) => c.id === draft.id) : undefined;
  const checkedUrls = new Set(result?.sources.map((source) => source.url));
  // After an edit the daily check saw other links than these: it says nothing about them.
  const isDailyCurrent =
    result !== undefined &&
    urls.length === checkedUrls.size &&
    urls.every((url) => checkedUrls.has(url));
  const states = urls.map((url) =>
    linkState(
      checks.get(url),
      isDailyCurrent
        ? result.sources
            .map((source) => acknowledgeLimits(source, draft.limits))
            .find((source) => source.url === url)
        : undefined,
    ),
  );

  if (states.some((state) => state.kind === 'checking')) return { tone: 'unknown', text: 'בודק…' };
  if (states.every((state) => state.kind === 'unknown')) return UNKNOWN;

  const [first, ...backups] = states;
  if (first === undefined) return UNKNOWN;
  const hasWorkingBackup = backups.some(isUsable);

  if (first.kind === 'ok') {
    const isBackupBroken = backups.some((state) => state.kind === 'down');
    return isBackupBroken
      ? { tone: 'warn', text: 'עובד, הגיבוי שבור' }
      : { tone: 'good', text: 'תקין' };
  }
  if (first.kind === 'limited') {
    return { tone: 'warn', text: `עובד עם הגבלות: ${first.limits}` };
  }
  if (hasWorkingBackup) return { tone: 'warn', text: 'הקישור הראשי שבור, הגיבוי עובד' };
  if (first.kind === 'down') {
    return { tone: first.isHereOnly ? 'warn' : 'bad', text: first.text };
  }
  return UNKNOWN;
}

/** What the "problems" filter lists: broken or partly broken, not merely unknown. */
export const isProblem = (health: Health) => health.tone === 'bad' || health.tone === 'warn';
