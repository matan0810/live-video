import { describe, expect, it } from 'vitest';
import { buildBookmarklet, readBookmarkletPayload } from './bookmarklet';

const ADMIN = 'https://site.example/live-video/#/admin';

function hashFor(data: unknown) {
  return `#/admin?add=${encodeURIComponent(JSON.stringify(data))}`;
}

describe('buildBookmarklet', () => {
  it('produces a javascript: link that targets the admin page', () => {
    const link = buildBookmarklet(ADMIN);
    expect(link.startsWith('javascript:')).toBe(true);
    const code = decodeURIComponent(link.slice('javascript:'.length));
    expect(code).toContain(JSON.stringify(ADMIN));
    expect(code).toContain("getEntriesByType('resource')");
    expect(code).not.toContain('\n');
  });

  it('runs: collects loaded playlists and opens the admin page with them', () => {
    const opened: string[] = [];
    const scope = {
      performance: {
        getEntriesByType: () => [
          { name: 'https://cdn.example/live/master.m3u8' },
          { name: 'https://cdn.example/app.js' },
          { name: 'http://insecure.example/x.m3u8' },
        ],
      },
      document: { title: 'ערוץ בדיקה', querySelectorAll: () => [] },
      location: { href: 'https://tv.example/live' },
      window: { open: (url: string) => opened.push(url) },
      alert: () => undefined,
    };
    const code = decodeURIComponent(buildBookmarklet(ADMIN).slice('javascript:'.length));
    new Function(...Object.keys(scope), code)(...Object.values(scope));
    expect(opened).toHaveLength(1);
    expect(readBookmarkletPayload(new URL(opened[0] ?? '').hash)).toEqual({
      links: ['https://cdn.example/live/master.m3u8'],
      title: 'ערוץ בדיקה',
      page: 'https://tv.example/live',
    });
  });
});

describe('readBookmarkletPayload', () => {
  it('returns nothing for a plain admin address', () => {
    expect(readBookmarkletPayload('#/admin')).toBeNull();
  });

  it('keeps only https playlist links, once each', () => {
    const payload = readBookmarkletPayload(
      hashFor({
        links: ['https://a.example/x.m3u8', 'https://a.example/x.m3u8', 'javascript:alert(1)', 5],
        title: 'T',
        page: 'https://tv.example',
      }),
    );
    expect(payload?.links).toEqual(['https://a.example/x.m3u8']);
  });

  it.each([
    ['broken JSON', '#/admin?add=%7Bnope'],
    ['no usable links', hashFor({ links: ['https://a.example/page.html'] })],
    ['not an object', hashFor('text')],
  ])('ignores %s', (_label, hash) => {
    expect(readBookmarkletPayload(hash)).toBeNull();
  });
});
