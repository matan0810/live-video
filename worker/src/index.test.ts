import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from './env';
import worker from './index';

const capture = vi.hoisted(() => ({ urls: [] as string[], calls: 0 }));
vi.mock('./cloudflareBrowser', () => ({
  startCloudflareSession: async () => ({
    async open(_url: string, onRequest: (url: string) => void) {
      capture.calls += 1;
      for (const url of capture.urls) onRequest(url);
    },
    async tryPlay() {
      // The fake page needs no nudge.
    },
    async close() {
      // Nothing to release.
    },
  }),
}));

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
    delete: async (key: string) => void store.delete(key),
    list: async ({ prefix = '', limit = 1000 }: { prefix?: string; limit?: number }) => ({
      keys: [...store.keys()]
        .filter((name) => name.startsWith(prefix))
        .sort()
        .slice(0, limit)
        .map((name) => ({ name })),
    }),
  };
}

/** Cloudflare's per-minute rate limiter, counting in memory like the real one. */
function createFakeLimiter(limit: number) {
  const counts = new Map<string, number>();
  return {
    limit: async ({ key }: { key: string }) => {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return { success: count <= limit };
    },
  };
}

let kv: ReturnType<typeof createFakeKv>;
let env: Env;

beforeEach(() => {
  kv = createFakeKv();
  env = {
    KV: kv as unknown as Env['KV'],
    ADMIN_PASSWORD: PASSWORD,
    ALLOWED_ORIGINS: ORIGIN,
    LOGIN_LIMITER: createFakeLimiter(5),
    REPORT_LIMITER: createFakeLimiter(3),
    EXTRACT_LIMITER: createFakeLimiter(10),
  };
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
    ['GET', '/admin/link-status'],
    ['POST', '/admin/extract'],
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

describe('link status', () => {
  it('is null before the first daily check', async () => {
    const response = await call('GET', '/admin/link-status', { token: await signIn() });
    expect(await response.json()).toEqual({ status: null });
  });

  it('returns the latest daily check, and nothing that is not one', async () => {
    const run = { checkedAt: '2026-11-22T04:17:00.000Z', from: 'הקוד', channels: [] };
    kv.store.set('links:status', JSON.stringify(run));
    const token = await signIn();
    expect(await (await call('GET', '/admin/link-status', { token })).json()).toEqual({
      status: run,
    });
    kv.store.set('links:status', JSON.stringify({ hello: 'world' }));
    expect(await (await call('GET', '/admin/link-status', { token })).json()).toEqual({
      status: null,
    });
  });
});

describe('channels', () => {
  it('returns null until a list is saved, then the saved list', async () => {
    expect(await (await call('GET', '/channels')).json()).toEqual({
      channels: null,
      appVersion: null,
    });

    const token = await signIn();
    expect((await call('PUT', '/admin/channels', { body: [channel], token })).status).toBe(200);
    expect(await (await call('GET', '/channels')).json()).toEqual({
      channels: [channel],
      appVersion: null,
    });
  });

  it('rejects an invalid list and keeps the saved one', async () => {
    const token = await signIn();
    await call('PUT', '/admin/channels', { body: [channel], token });
    const invalid = [{ ...channel, sources: ['http://a.example/live.m3u8'] }];
    expect((await call('PUT', '/admin/channels', { body: invalid, token })).status).toBe(400);
    expect(await (await call('GET', '/channels')).json()).toEqual({
      channels: [channel],
      appVersion: null,
    });
  });

  it('keeps the previous list as a backup', async () => {
    const token = await signIn();
    await call('PUT', '/admin/channels', { body: [channel], token });
    await call('PUT', '/admin/channels', { body: [], token });
    expect(JSON.parse(kv.store.get('channels:previous') ?? 'null')).toEqual([channel]);
  });
});

describe('rate limiter trouble', () => {
  it('lets a login through when the limiter throws or never answers', async () => {
    env.LOGIN_LIMITER = {
      limit: () => Promise.reject(new Error('limiter down')),
    } as unknown as Env['LOGIN_LIMITER'];
    expect((await call('POST', '/admin/login', { body: { password: PASSWORD } })).status).toBe(200);
    env.LOGIN_LIMITER = {
      limit: () => new Promise(() => undefined),
    } as unknown as Env['LOGIN_LIMITER'];
    expect((await call('POST', '/admin/login', { body: { password: PASSWORD } })).status).toBe(200);
  });
});

describe('channel list version', () => {
  it('stores the site version a list was saved on, and reports it', async () => {
    const token = await signIn();
    const saved = await call('PUT', '/admin/channels', {
      body: { channels: [channel], appVersion: '2.7.1' },
      token,
    });
    expect(saved.status).toBe(200);
    expect(await (await call('GET', '/channels')).json()).toEqual({
      channels: [channel],
      appVersion: '2.7.1',
    });
  });

  it('still accepts a bare list from older sites, with no version', async () => {
    const token = await signIn();
    kv.store.set('channels:version', '2.7.1');
    expect((await call('PUT', '/admin/channels', { body: [channel], token })).status).toBe(200);
    expect(await (await call('GET', '/channels')).json()).toEqual({
      channels: [channel],
      appVersion: null,
    });
  });

  it('rejects a malformed version', async () => {
    const token = await signIn();
    const body = { channels: [channel], appVersion: '2.7.1; drop' };
    expect((await call('PUT', '/admin/channels', { body, token })).status).toBe(400);
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

  it('limits how many reports one address can send, without writing to KV for it', async () => {
    for (let count = 0; count < 3; count += 1) await call('POST', '/reports', { body: report });
    expect((await call('POST', '/reports', { body: report })).status).toBe(429);
    expect([...kv.store.keys()].filter((key) => key.startsWith('rate:'))).toEqual([]);
  });

  it('keeps reports sent at the same moment, newest first', async () => {
    await Promise.all(
      ['a', 'b', 'c'].map((note) => call('POST', '/reports', { body: { ...report, note } })),
    );
    const token = await signIn();
    const { reports } = (await (await call('GET', '/admin/reports', { token })).json()) as {
      reports: { note: string; createdAt: string }[];
    };
    expect(reports.map((item) => item.note).sort()).toEqual(['a', 'b', 'c']);
    const times = reports.map((item) => item.createdAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  it('carries over reports stored in the old single list', async () => {
    const old = { ...report, note: 'old', id: 'legacy', createdAt: '2026-01-01T00:00:00.000Z' };
    kv.store.set('reports', JSON.stringify([old, { junk: true }]));
    const token = await signIn();
    const { reports } = (await (await call('GET', '/admin/reports', { token })).json()) as {
      reports: { note: string; id: string }[];
    };
    expect(reports).toMatchObject([{ note: 'old' }]);
    expect(reports[0]?.id).toMatch(/^\d{13}-/);
    expect(kv.store.has('reports')).toBe(false);
  });

  it('refuses to delete an id that is not a report id', async () => {
    const token = await signIn();
    expect((await call('DELETE', '/admin/reports/..%2Fchannels', { token })).status).toBe(404);
  });
});

describe('routing', () => {
  it('answers 404 for unknown paths', async () => {
    expect((await call('GET', '/nope')).status).toBe(404);
  });
});

describe('stream link extraction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    capture.urls = [];
    capture.calls = 0;
  });

  function servePages(pages: Record<string, string>) {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const page = pages[String(input)];
      return page === undefined ? new Response('', { status: 404 }) : new Response(page);
    });
  }

  it('finds links on the page and in its embedded player, without a browser', async () => {
    servePages({
      'https://tv.example/live':
        '<script>src: "https://cdn.example/a.m3u8"</script><iframe src="/player"></iframe>',
      'https://tv.example/player': '<video src="https://cdn.example/b.m3u8"></video>',
    });
    env.BROWSER = {} as Fetcher;
    const token = await signIn();
    const response = await call('POST', '/admin/extract', {
      body: { url: 'https://tv.example/live' },
      token,
    });
    expect(await response.json()).toEqual({
      links: [
        { url: 'https://cdn.example/a.m3u8', source: 'page' },
        { url: 'https://cdn.example/b.m3u8', source: 'frame' },
      ],
      pagesScanned: 2,
      browser: 'not-needed',
    });
    expect(capture.calls).toBe(0);
  });

  it('opens the page in a browser when the source holds no link', async () => {
    servePages({ 'https://tv.example/live': '<div id="app"></div>' });
    capture.urls = ['https://site.example/app.js', 'https://cdn.example/live/master.m3u8'];
    env.BROWSER = {} as Fetcher;
    const token = await signIn();
    const response = await call('POST', '/admin/extract', {
      body: { url: 'https://tv.example/live' },
      token,
    });
    expect(await response.json()).toEqual({
      links: [{ url: 'https://cdn.example/live/master.m3u8', source: 'browser' }],
      pagesScanned: 1,
      browser: 'used',
    });
  });

  it('says when no browser is configured', async () => {
    servePages({ 'https://tv.example/live': '<div id="app"></div>' });
    const token = await signIn();
    const response = await call('POST', '/admin/extract', {
      body: { url: 'https://tv.example/live' },
      token,
    });
    expect(await response.json()).toMatchObject({ links: [], browser: 'unavailable' });
  });

  it('rejects addresses that are not https, and pages that fail to load', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const token = await signIn();
    const insecure = await call('POST', '/admin/extract', {
      body: { url: 'http://a.example' },
      token,
    });
    expect(insecure.status).toBe(400);
    const failing = await call('POST', '/admin/extract', {
      body: { url: 'https://a.example' },
      token,
    });
    expect(failing.status).toBe(502);
  });
});
