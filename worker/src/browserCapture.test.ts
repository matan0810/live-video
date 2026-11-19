import { describe, expect, it, vi } from 'vitest';
import { captureStreamRequests, type CaptureSession, type CaptureTimings } from './browserCapture';

const FAST: CaptureTimings = { beforePlayMs: 20, totalMs: 200, settleMs: 20, pollMs: 5 };

/** A fake tab that "requests" the given URLs at the given moments. */
function fakeSession(
  onOpen: (emit: (url: string) => void) => void,
  onPlay: (emit: (url: string) => void) => void = () => undefined,
) {
  let emit: (url: string) => void = () => undefined;
  const session: CaptureSession & { closed: boolean; played: number } = {
    closed: false,
    played: 0,
    async open(_url, onRequest) {
      emit = onRequest;
      onOpen(emit);
    },
    async tryPlay() {
      session.played += 1;
      onPlay(emit);
    },
    async close() {
      session.closed = true;
    },
  };
  return session;
}

describe('captureStreamRequests', () => {
  it('records playlists the player requests on its own, ignoring other requests', async () => {
    const session = fakeSession((emit) => {
      emit('https://site.example/app.js');
      emit('https://cdn.example/live/master.m3u8');
      emit('https://cdn.example/live/master.m3u8');
      emit('https://cdn.example/live/seg1.ts');
    });
    const links = await captureStreamRequests(async () => session, 'https://site.example', FAST);
    expect(links).toEqual(['https://cdn.example/live/master.m3u8']);
    expect(session.played).toBe(0);
    expect(session.closed).toBe(true);
  });

  it('nudges a player that waits for a click', async () => {
    const session = fakeSession(
      () => undefined,
      (emit) => emit('https://cdn.example/live/index.m3u8'),
    );
    const links = await captureStreamRequests(async () => session, 'https://site.example', FAST);
    expect(links).toEqual(['https://cdn.example/live/index.m3u8']);
    expect(session.played).toBe(1);
  });

  it('gives up after its budget and still closes the browser', async () => {
    const session = fakeSession(() => undefined);
    const started = Date.now();
    expect(await captureStreamRequests(async () => session, 'https://site.example', FAST)).toEqual(
      [],
    );
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(session.closed).toBe(true);
  });

  it('closes the browser when the page fails to open', async () => {
    const session = fakeSession(() => {
      throw new Error('navigation failed');
    });
    const close = vi.spyOn(session, 'close');
    await expect(
      captureStreamRequests(async () => session, 'https://site.example', FAST),
    ).rejects.toThrow('navigation failed');
    expect(close).toHaveBeenCalled();
  });
});
