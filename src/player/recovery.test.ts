import { describe, expect, it } from 'vitest';
import { networkRetryDelay, RestartBudget, StallWatch } from './recovery';

describe('networkRetryDelay', () => {
  it('backs off, then gives up', () => {
    expect(networkRetryDelay(0)).toBe(1000);
    expect(networkRetryDelay(3)).toBe(8000);
    expect(networkRetryDelay(6)).toBe(15_000);
    expect(networkRetryDelay(7)).toBeNull();
  });
});

describe('StallWatch', () => {
  it('reports video that stops moving, once per period', () => {
    const watch = new StallWatch(10_000);
    expect(watch.isStalled(0, 5, true)).toBe(false);
    expect(watch.isStalled(9_000, 5, true)).toBe(false);
    expect(watch.isStalled(10_000, 5, true)).toBe(true);
    expect(watch.isStalled(12_000, 5, true)).toBe(false);
    expect(watch.isStalled(20_000, 5, true)).toBe(true);
  });

  it('ignores moving and paused video', () => {
    const watch = new StallWatch(10_000);
    expect(watch.isStalled(0, 1, true)).toBe(false);
    expect(watch.isStalled(11_000, 2, true)).toBe(false);
    expect(watch.isStalled(30_000, 2, false)).toBe(false);
    expect(watch.isStalled(35_000, 2, true)).toBe(false);
  });
});

describe('RestartBudget', () => {
  it('allows a few restarts in a window and forgets old ones', () => {
    const budget = new RestartBudget(2, 60_000);
    expect(budget.take(0)).toBe(true);
    expect(budget.take(1_000)).toBe(true);
    expect(budget.take(2_000)).toBe(false);
    expect(budget.take(200_000)).toBe(true);
  });
});
