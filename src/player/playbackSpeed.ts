/** The speeds offered, slowest first. */
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

/**
 * A live stream cannot play faster than it is broadcast: faster speeds are offered only
 * while behind live, and slower ones whenever the stream keeps past minutes to fall into.
 */
export function isSpeedAllowed(speed: Speed, isLive: boolean): boolean {
  return speed <= 1 || !isLive;
}

/** Back to normal speed once a faster speed has caught up with live. */
export function speedAfterCatchingUp(speed: Speed, isLive: boolean): Speed {
  return speed > 1 && isLive ? 1 : speed;
}
