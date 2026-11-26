/**
 * Whether a parsed value is a plain object whose fields can be read and then checked one by
 * one: the first step in validating anything from outside, instead of casting it.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
