import { beforeEach, describe, expect, it } from 'vitest';
import type { Env } from './env';
import worker from './index';

const ORIGIN = 'https://site.example';
const PASSWORD = 'correct horse battery staple';

/** The small part of KV the worker uses, backed by a Map. */
function createFakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    get: async (key: string, type?: string) => {
      const value = store.get(key) ?? null;
      return value !== null && type === 'json' ? JSON.parse(value) : value;
    },
    put: async (key: string, value: string) => void store.set(key, value),
  };
}

let kv: ReturnType<typeof createFakeKv>;
let env: Env;

beforeEach(() => {
  kv = createFakeKv();
  env = { KV: kv as unknown as Env['KV'], ADMIN_PASSWORD: PASSWORD, ALLOWED_ORIGINS: ORIGIN };
});

function call(method: string, path: string, options: { body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = { Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const hasBody = method !== 'GET' && options.body !== undefined;
  const body = hasBody ? JSON.stringify(options.body) : undefined;
  return worker.fetch(new Request(`https://api.example${path}`, { method, headers, body }), env);
}

async function signIn() {
  const response = await call('POST', '/admin/login', { body: { password: PASSWORD } });
  const { token } = (await response.json()) as { token: string };
  return token;
}

const channel = {
  id: 'demo',
  name: 'Demo',
  short: 'D',
  group: 'world',
  sources: ['https://a.example/live.m3u8'],
};
const report = { channelId: 'demo', channelName: 'Demo', reason: 'not-working' };

describe('CORS', () => {
  it('allows a listed origin', async () => {
    const response = await call('GET', '/channels');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('gives no CORS headers to other origins', async () => {
    const request = new Request('https://api.example/channels', {
      headers: { Origin: 'https://evil.example' },
    });
    const response = await worker.fetch(request, env);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('login', () => {
  it('rejects a wrong password', async () => {
    const response = await call('POST', '/admin/login', { body: { password: 'guess' } });
    expect(response.status).toBe(401);
  });

  it('locks out after repeated attempts, even with the right password', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await call('POST', '/admin/login', { body: { password: 'guess' } });
    }
    const response = await call('POST', '/admin/login', { body: { password: PASSWORD } });
    expect(response.status).toBe(429);
  });
});

describe('admin endpoints', () => {
  it.each([
    ['PUT', '/admin/channels'],
    ['GET', '/admin/reports'],
    ['DELETE', '/admin/reports/some-id'],
  ])('%s %s requires a session', async (method, path) => {
    expect((await call(method, path, { body: [] })).status).toBe(401);
    expect((await call(method, path, { body: [], token: '9999999999999.forged' })).status).toBe(
      401,
    );
  });

  it('rejects a session signed with an old password', async () => {
    const token = await signIn();
    env.ADMIN_PASSWORD = 'a new password';
    expect((await call('GET', '/admin/reports', { token })).status).toBe(401);
  });
});

describe('channels', () => {
  it('returns null until a list is saved, then the saved list', async () => {
    expect(await (await call('GET', '/channels')).json()).toEqual({ channels: null });

    const token = await signIn();
    expect((await call('PUT', '/admin/channels', { body: [channel], token })).status).toBe(200);
    expect(await (await call('GET', '/channels')).json()).toEqual({ channels: [channel] });
  });

  it('rejects an invalid list and keeps the saved one', async () => {
    const token = await signIn();
    await call('PUT', '/admin/channels', { body: [channel], token });
    const invalid = [{ ...channel, sources: ['http://a.example/live.m3u8'] }];
    expect((await call('PUT', '/admin/channels', { body: invalid, token })).status).toBe(400);
    expect(await (await call('GET', '/channels')).json()).toEqual({ channels: [channel] });
  });

  it('keeps the previous list as a backup', async () => {
    const token = await signIn();
    await call('PUT', '/admin/channels', { body: [channel], token });
    await call('PUT', '/admin/channels', { body: [], token });
    expect(JSON.parse(kv.store.get('channels:previous') ?? 'null')).toEqual([channel]);
  });
});

describe('reports', () => {
  it('stores a report that only the admin can read and delete', async () => {
    expect((await call('POST', '/reports', { body: report })).status).toBe(201);
    expect((await call('GET', '/admin/reports')).status).toBe(401);

    const token = await signIn();
    const listed = (await (await call('GET', '/admin/reports', { token })).json()) as {
      reports: { id: string }[];
    };
    expect(listed.reports).toMatchObject([report]);

    const reportId = listed.reports[0]?.id;
    const afterDelete = await call('DELETE', `/admin/reports/${reportId}`, { token });
    expect(await afterDelete.json()).toEqual({ reports: [] });
  });

  it('rejects invalid and oversized reports', async () => {
    expect((await call('POST', '/reports', { body: { ...report, reason: 'x' } })).status).toBe(400);
    const oversized = { ...report, note: 'x'.repeat(5000) };
    expect((await call('POST', '/reports', { body: oversized })).status).toBe(413);
  });

  it('limits how many reports one address can send', async () => {
    for (let count = 0; count < 10; count += 1) await call('POST', '/reports', { body: report });
    expect((await call('POST', '/reports', { body: report })).status).toBe(429);
  });
});

describe('routing', () => {
  it('answers 404 for unknown paths', async () => {
    expect((await call('GET', '/nope')).status).toBe(404);
  });
});
