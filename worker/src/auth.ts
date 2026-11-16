import type { Env } from './env';
import { HttpError } from './http';

const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text: string) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

/** Compares two strings without leaking, through timing, where they first differ. */
function isEqualConstantTime(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index % Math.max(b.length, 1));
  }
  return difference === 0;
}

async function sign(env: Env, expiresAt: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.ADMIN_PASSWORD),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(`session:${expiresAt}`)));
}

export async function isCorrectPassword(env: Env, candidate: unknown) {
  if (typeof candidate !== 'string' || !env.ADMIN_PASSWORD) return false;
  // Hashing first makes both sides the same length, whatever was typed.
  return isEqualConstantTime(await sha256Hex(candidate), await sha256Hex(env.ADMIN_PASSWORD));
}

/**
 * Session tokens are "<expiry>.<signature>", signed with the admin password itself,
 * so changing the password signs every existing session out.
 */
export async function createSessionToken(env: Env, now = Date.now()) {
  const expiresAt = now + SESSION_MS;
  return `${expiresAt}.${await sign(env, expiresAt)}`;
}

export async function requireAdmin(request: Request, env: Env, now = Date.now()) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  const [expiresAtText = '', signature = ''] = token.split('.');
  const expiresAt = Number(expiresAtText);

  const isValid =
    Boolean(env.ADMIN_PASSWORD) &&
    Number.isSafeInteger(expiresAt) &&
    expiresAt > now &&
    isEqualConstantTime(signature, await sign(env, expiresAt));
  if (!isValid) throw new HttpError(401, 'Not signed in');
}
