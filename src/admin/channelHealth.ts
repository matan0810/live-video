import { channelVerdict, type ChannelVerdict, type LinkStatus } from '../../shared/linkStatus';
import { draftSources, type DraftChannel } from './drafts';
import type { StreamCheckState } from './useStreamChecks';

/** How a channel is doing, for the dot beside its name. */
export type Tone = 'good' | 'warn' | 'bad' | 'unknown';

export interface Health {
  tone: Tone;
  text: string;
}

const FROM_VERDICT: Record<ChannelVerdict, Health> = {
  ok: { tone: 'good', text: 'תקין' },
  partial: { tone: 'warn', text: 'קישור אחד שבור' },
  limited: { tone: 'warn', text: 'לא בכל דפדפן' },
  problems: { tone: 'bad', text: 'אי אפשר לצפות' },
  down: { tone: 'bad', text: 'לא עובד' },
  abroad: { tone: 'unknown', text: 'לא נבדק (חסום מחוץ לישראל)' },
  'no-link': { tone: 'bad', text: 'בלי קישור' },
};

const UNKNOWN: Health = { tone: 'unknown', text: 'לא נבדק' };

/**
 * The channel's state as best known: a check just run from this browser, else the daily
 * check, if it saw these very links (after an edit it saw something else).
 */
export function healthOf(
  draft: DraftChannel,
  daily: LinkStatus | null | undefined | 'unavailable',
  checks: ReadonlyMap<string, StreamCheckState>,
): Health {
  const sources = draftSources(draft);
  if (sources.length === 0) return FROM_VERDICT['no-link'];

  const live = sources.map((url) => checks.get(url));
  if (live.some((state) => state === 'checking')) return { tone: 'unknown', text: 'בודק…' };
  if (live.every((state) => state !== undefined)) {
    const working = live.filter(
      (state) => state !== undefined && state !== 'checking' && state.isWorking,
    );
    if (working.length === sources.length) return { tone: 'good', text: 'תקין (נבדק עכשיו)' };
    if (working.length > 0) return FROM_VERDICT.partial;
    return FROM_VERDICT.down;
  }

  if (daily && daily !== 'unavailable') {
    const result = daily.channels.find((channel) => channel.id === draft.id);
    const checked = new Set(result?.sources.map((source) => source.url));
    if (result && sources.length === checked.size && sources.every((url) => checked.has(url))) {
      return FROM_VERDICT[channelVerdict(result.sources)];
    }
  }
  return UNKNOWN;
}

/** What the "problems" filter lists: broken or partly broken, not merely unknown. */
export const isProblem = (health: Health) => health.tone === 'bad' || health.tone === 'warn';
