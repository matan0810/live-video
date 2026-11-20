import { sha256Hex } from './auth';
import type { Env } from './env';
import { HttpError } from './http';

/** How long to wait for Cloudflare's rate limiter before letting a request through. */
const LIMITER_WAIT_MS = 1000;

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
  const key = await addressKey(request, env, scope);
  // The limiter is a convenience, not the only guard (logins also have the KV window): if it
  // fails or is slow somewhere, let the request through rather than hang it.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), LIMITER_WAIT_MS);
  });
  const outcome = await Promise.race([limiter.limit({ key }), timeout])
    .catch((error: unknown) => {
      console.error(`Rate limiter failed (${scope})`, error);
      return null;
    })
    .finally(() => clearTimeout(timer));
  if (outcome === null) console.error(`Rate limiter gave no answer (${scope}); request allowed`);
  else if (!outcome.success) throw new HttpError(429, 'Too many requests, try again later');
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
