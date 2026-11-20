/** Waits between attempts to reload a stream that lost the network after it had played. */
const NETWORK_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15_000, 15_000, 15_000];

/** How long to wait before network retry number `attempt` (from 0), or null to give up. */
export function networkRetryDelay(attempt: number): number | null {
  return NETWORK_RETRY_DELAYS_MS[attempt] ?? null;
}

/**
 * Notices video that should be moving but is not: not paused, yet its time has not
 * advanced for `stallMs`. Live streams sometimes freeze like this without any error.
 */
export class StallWatch {
  private lastTime = -1;
  private lastProgressAt = 0;

  constructor(private readonly stallMs: number) {}

  /** Call regularly; returns true once per `stallMs` while the video is stuck. */
  isStalled(now: number, currentTime: number, shouldBeMoving: boolean): boolean {
    if (!shouldBeMoving || currentTime !== this.lastTime) {
      this.lastTime = currentTime;
      this.lastProgressAt = now;
      return false;
    }
    if (now - this.lastProgressAt < this.stallMs) return false;
    this.lastProgressAt = now;
    return true;
  }
}

/**
 * Counts restarts of one source, forgetting old ones: a stream that freezes once an hour
 * is fine, one that freezes again right after each restart is broken.
 */
export class RestartBudget {
  private recent: number[] = [];

  constructor(
    private readonly maxRestarts: number,
    private readonly windowMs: number,
  ) {}

  /** Records a restart at `now`; false when the budget is spent and the source should be dropped. */
  take(now: number): boolean {
    this.recent = [...this.recent.filter((time) => now - time < this.windowMs), now];
    return this.recent.length <= this.maxRestarts;
  }
}
