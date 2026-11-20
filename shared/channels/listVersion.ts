const VERSION = /^\d{1,4}\.\d{1,5}\.\d{1,6}$/;

export function isVersion(value: unknown): value is string {
  return typeof value === 'string' && VERSION.test(value);
}

/** Compares two `MAJOR.MINOR.PATCH` versions: negative, zero or positive. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Which channel list viewers get. The list saved in the admin area records the site version
 * it was saved on. A release whose version is newer brings its own list (into which the
 * admin's list was synced before releasing); a save made on that release or later wins again.
 * A list saved before versions were recorded counts as older than any release.
 */
export function isSavedListCurrent(savedWith: string | null, siteVersion: string): boolean {
  return savedWith !== null && compareVersions(savedWith, siteVersion) >= 0;
}
