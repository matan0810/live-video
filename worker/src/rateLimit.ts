import { sha256Hex } from './auth';
import type { Env } from './env';
import { HttpError } from './http';

interface RateLimit {
  /** Names the counter, e.g. "login". */
  scope: string;
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Allows `maxRequests` per client address per window. KV is eventually consistent,
 * so the limit is approximate: enough to stop guessing and flooding, not exact.
 * The address is stored only as a salted hash, and only until the window ends.
 */
export async function enforceRateLimit(request: Request, env: Env, limit: RateLimit) {
  const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const addressHash = (await sha256Hex(`${limit.scope}:${address}:${env.ADMIN_PASSWORD}`)).slice(
    0,
    32,
  );
  const key = `rate:${limit.scope}:${addressHash}`;

  const count = Number((await env.KV.get(key)) ?? 0);
  if (count >= limit.maxRequests) throw new HttpError(429, 'Too many requests, try again later');
  await env.KV.put(key, String(count + 1), { expirationTtl: limit.windowSeconds });
}
