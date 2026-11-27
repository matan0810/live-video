import { storedChoice } from '../hooks/storedValues';

/**
 * How long a place in a live stream is kept: coming back to a channel within that time
 * picks up where the viewer was. A choice of the viewer's (in the settings), not a number
 * buried in the code.
 */
export const RESUME_CHOICES = ['off', '1h', '2h', '12h'] as const;
export type ResumeChoice = (typeof RESUME_CHOICES)[number];

export const DEFAULT_RESUME: ResumeChoice = '2h';
export const RESUME_KEY = 'live-video:resume';

const HOUR_MS = 60 * 60 * 1000;
const AGES: Record<ResumeChoice, number> = {
  off: 0,
  '1h': HOUR_MS,
  '2h': 2 * HOUR_MS,
  '12h': 12 * HOUR_MS,
};

/** How old a kept place may be, in milliseconds; zero means none is kept. */
export const resumeMaxAgeMs = (choice: ResumeChoice) => AGES[choice];

export const parseResumeChoice = (value: unknown): ResumeChoice | null =>
  storedChoice(value, RESUME_CHOICES);
