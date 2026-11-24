/** The sleep timer's choices, in minutes. */
export const SLEEP_MINUTES = [15, 30, 60, 90] as const;
export type SleepMinutes = (typeof SLEEP_MINUTES)[number];

/** Whole minutes left, rounded up, so it never says 0 while still running. */
export function minutesLeft(endsAt: number, now: number): number {
  return Math.max(1, Math.ceil((endsAt - now) / 60_000));
}
