import { isHttpsUrl } from './channels/url';

export const REPORT_REASONS = ['not-working', 'new-link', 'wrong-content', 'other'] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** What a viewer sends when reporting a problem with a channel. */
export interface ReportInput {
  channelId: string;
  channelName: string;
  reason: ReportReason;
  note?: string;
  suggestedUrl?: string;
}

/** A stored report, as the admin sees it. */
export interface Report extends ReportInput {
  id: string;
  createdAt: string;
}

export const REPORT_LIMITS = {
  channelId: 64,
  channelName: 80,
  note: 500,
  suggestedUrl: 2000,
} as const;

// Control characters and characters that reorder or hide text have no place in a report.
const UNSAFE_CHARACTERS = /[\p{Cc}\u200B-\u200F\u202A-\u202E\u2066-\u2069]/gu;

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(UNSAFE_CHARACTERS, ' ').trim();
  return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null;
}

function isReportReason(value: unknown): value is ReportReason {
  return REPORT_REASONS.some((reason) => reason === value);
}

/** Validates untrusted report data. Returns null when anything is missing or malformed. */
export function parseReportInput(data: unknown): ReportInput | null {
  if (typeof data !== 'object' || data === null) return null;
  const { channelId, channelName, reason, note, suggestedUrl } = data as Record<string, unknown>;

  const cleanId = cleanText(channelId, REPORT_LIMITS.channelId);
  const cleanName = cleanText(channelName, REPORT_LIMITS.channelName);
  if (!cleanId || !cleanName || !isReportReason(reason)) return null;

  const report: ReportInput = { channelId: cleanId, channelName: cleanName, reason };

  if (note !== undefined && note !== '') {
    const cleanNote = cleanText(note, REPORT_LIMITS.note);
    if (!cleanNote) return null;
    report.note = cleanNote;
  }
  if (suggestedUrl !== undefined && suggestedUrl !== '') {
    const isValidUrl =
      isHttpsUrl(suggestedUrl) && suggestedUrl.length <= REPORT_LIMITS.suggestedUrl;
    if (!isValidUrl) return null;
    report.suggestedUrl = suggestedUrl;
  }
  return report;
}
