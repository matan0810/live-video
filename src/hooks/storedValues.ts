/**
 * Readers for values kept in the browser's storage, which anyone (or an old version of the
 * site) may have changed: each checks the value and gives null when it does not fit.
 */
export function storedString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** A list of strings, keeping only the entries that are strings. */
export function storedStrings(value: unknown): string[] | null {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : null;
}

/** One of a closed list of choices (a setting), or null. */
export function storedChoice<T extends string>(value: unknown, choices: readonly T[]): T | null {
  return choices.find((choice) => choice === value) ?? null;
}

export function storedBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}
