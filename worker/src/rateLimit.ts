import { sha256Hex } from './auth';
import type { Env } from './env';
import { HttpError } from './http';

/** A limit over a long window, counted in KV. */
interface WindowLimit {
  /** Names the counter, e.g. "login". */
  scope: string;
  maxRequests: number;
  windowSeconds: number;
}

/** The sender's address, hashed with the scope and a secret so it is never kept in the clear. */
async function addressKey(request: Request, env: Env, scope: string) {
  const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  return (await sha256Hex(`${scope}:${address}:${env.ADMIN_PASSWORD}`)).slice(0, 32);
}

/**
 * Cloudflare's own rate limiter: a burst limit per address per minute, kept in memory at
 * the edge. It writes nothing to KV, so a flood of requests cannot use up KV's daily
 * write allowance (which the admin's saves depend on).
 */
export async function enforceBurstLimit(
  request: Request,
  env: Env,
  limiter: RateLimit,
  scope: string,
) {
  const { success } = await limiter.limit({ key: await addressKey(request, env, scope) });
  if (!success) throw new HttpError(429, 'Too many requests, try again later');
}

/**
 * Allows `maxRequests` per client address per window, for windows longer than the burst
 * limiter supports. KV is eventually consistent, so the limit is approximate: enough to
 * stop guessing, not exact. The address is stored only as a salted hash, until the window ends.
 */
export async function enforceWindowLimit(request: Request, env: Env, limit: WindowLimit) {
  const key = `rate:${limit.scope}:${await addressKey(request, env, limit.scope)}`;
  const count = Number((await env.KV.get(key)) ?? 0);
  if (count >= limit.maxRequests) throw new HttpError(429, 'Too many requests, try again later');
  await env.KV.put(key, String(count + 1), { expirationTtl: limit.windowSeconds });
}
