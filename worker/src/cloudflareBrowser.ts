import puppeteer from '@cloudflare/puppeteer';
import type { CaptureSession } from './browserCapture';

const VIEWPORT = { width: 1280, height: 720 };
const NAVIGATION_TIMEOUT_MS = 20_000;

/**
 * Runs inside the page: starts any video muted (browsers allow that without a click) and
 * presses the first thing that looks like a play button. Kept as a string because it runs
 * in the page, not in the Worker.
 */
const PLAY_SCRIPT = `(() => {
  for (const video of document.querySelectorAll('video')) {
    video.muted = true;
    video.play().catch(() => {});
  }
  const selectors = [
    '.vjs-big-play-button', '.jw-icon-playback', '.plyr__control--overlaid',
    '[aria-label*="play" i]', '[title*="play" i]', 'button[class*="play" i]',
    '[class*="play-button" i]', '[class*="playButton" i]'
  ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) { element.click(); break; }
  }
})()`;

/** A tab in Cloudflare Browser Run, adapted to what the capture needs. */
export async function startCloudflareSession(binding: Fetcher): Promise<CaptureSession> {
  const browser = await puppeteer.launch(binding);
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  return {
    async open(url, onRequest) {
      page.on('request', (request) => onRequest(request.url()));
      // A page that never finishes loading may still have started its player.
      await page
        .goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
        .catch(() => undefined);
    },
    async tryPlay() {
      await page.evaluate(PLAY_SCRIPT).catch(() => undefined);
      await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2).catch(() => undefined);
    },
    async close() {
      await browser.close().catch(() => undefined);
    },
  };
}
