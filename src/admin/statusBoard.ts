import {
  channelVerdict,
  describeSourceProblem,
  type ChannelResult,
  type ChannelVerdict,
  type SourceState,
} from '../../shared/linkStatus';
import type { Tone } from './channelHealth';

/** Worst first, so what needs the owner is at the top. */
const ORDER: readonly ChannelVerdict[] = [
  'down',
  'problems',
  'partial',
  'limited',
  'abroad',
  'no-link',
  'ok',
];

export const VERDICT_TEXT: Record<ChannelVerdict, string> = {
  down: 'לא עובדים',
  problems: 'עונים, אבל אי אפשר לצפות',
  partial: 'עובדים, עם קישור שבור',
  limited: 'עובדים, עם הגבלות',
  abroad: 'לא נבדקו (חסומים מחוץ לישראל)',
  'no-link': 'בלי קישור',
  ok: 'תקינים',
};

/** The dot colour of each verdict: the same four colours as the channel list. */
export const VERDICT_TONE: Record<ChannelVerdict, Tone> = {
  ok: 'good',
  partial: 'warn',
  limited: 'warn',
  problems: 'bad',
  down: 'bad',
  'no-link': 'bad',
  abroad: 'unknown',
};

/** The same colours for one link. */
export const SOURCE_TONE: Record<SourceState, Tone> = {
  ok: 'good',
  limited: 'warn',
  problems: 'bad',
  down: 'bad',
  abroad: 'unknown',
};

/**
 * The groups that start open: what the owner can act on (a channel viewers cannot watch, a
 * broken link to replace, a channel with no link) and what works with limits. The fine
 * channels, and those that cannot be checked from abroad, stay a count until asked for.
 */
export const OPEN_AT_FIRST: readonly ChannelVerdict[] = [
  'down',
  'problems',
  'partial',
  'limited',
  'no-link',
];

/** What is wrong with a channel in a few words: the first link that is not fine, and where. */
export function summaryLine(channel: ChannelResult): string {
  if (channel.sources.length === 0) return 'בלי קישור';
  const index = channel.sources.findIndex((source) => source.state !== 'ok');
  const source = channel.sources[index];
  if (!source) return 'תקין';
  return `${index === 0 ? 'ראשי' : `גיבוי ${index}`}: ${describeSourceProblem(source)}`;
}

export interface VerdictGroup {
  verdict: ChannelVerdict;
  channels: ChannelResult[];
}

/** The run's channels grouped by verdict, worst first, leaving out empty groups. */
export function groupByVerdict(channels: readonly ChannelResult[]): VerdictGroup[] {
  return ORDER.map((verdict) => ({
    verdict,
    channels: channels.filter((channel) => channelVerdict(channel.sources) === verdict),
  })).filter((group) => group.channels.length > 0);
}

/** The check runs daily; a run older than this means the workflow has stopped. */
const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

export function isStale(checkedAt: string, now: number) {
  return now - Date.parse(checkedAt) > STALE_AFTER_MS;
}
