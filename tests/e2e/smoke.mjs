// Browser smoke test: drives the built site in a real Chromium, on a desktop and on an
// emulated phone.
//
//   npm run build && npm run e2e
//
// Streams are not reachable from CI, so every request that leaves localhost is refused.
// That makes the "channel unavailable" path deterministic; real playback, rewind and the
// admin area (which needs the Worker) are checked by hand, as CLAUDE.md describes.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, devices } from 'playwright';
import { preview } from 'vite';

async function main() {
  const server = await preview({ preview: { port: 0 }, logLevel: 'silent' });
  const url = server.resolvedUrls.local[0];
  const browser = await chromium.launch();
  const problems = [];

  const open = async (options, tag) => {
    const context = await browser.newContext(options);
    await context.route(
      (target) => target.hostname !== 'localhost',
      (route) => route.abort(),
    );
    // Anything the Content Security Policy blocks is a failure: the site must live within it.
    await context.exposeFunction('__cspViolation', (what) =>
      problems.push(`${tag}: blocked by the CSP: ${what}`),
    );
    await context.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        window.__cspViolation(`${e.violatedDirective} ${e.blockedURI}`),
      );
    });
    // Records the media control handlers, which only the operating system can press.
    await context.addInitScript(() => {
      window.__mediaActions = {};
      const set = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
      navigator.mediaSession.setActionHandler = (action, handler) => {
        window.__mediaActions[action] = handler;
        set(action, handler);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => problems.push(`${tag}: ${error.message}`));
    return page;
  };
  const step = (name) => console.log(`ok  ${name}`);
  const sectionTitles = (page) => page.locator('nav [data-section-title]').allInnerTexts();

  // ---------- Desktop ----------
  const desktop = await open(
    { viewport: { width: 1280, height: 800 }, locale: 'he-IL' },
    'desktop',
  );
  await desktop.goto(url);
  assert.equal(await desktop.evaluate(() => document.documentElement.dir), 'rtl');
  assert.deepEqual(await sectionTitles(desktop), [
    'ישראל',
    'עולם · באנגלית',
    'בערבית',
    'שפות נוספות',
  ]);
  const { version } = JSON.parse(await readFile(new URL('../../package.json', import.meta.url)));
  await desktop.getByText(`v${version}`, { exact: true }).waitFor();
  await desktop.getByText('בחרו ערוץ מהרשימה').waitFor();
  const policy = await desktop
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  assert.match(policy ?? '', /default-src 'none'/, 'the page carries its CSP');
  assert.match(policy ?? '', /require-trusted-types-for 'script'/, 'with Trusted Types');
  step('desktop: channel list, empty state, version and the CSP');

  await desktop.getByRole('button', { name: 'כאן 11', exact: true }).click();
  await desktop.getByRole('alert').getByText('כאן 11 לא זמין כרגע').waitFor();
  assert.match(desktop.url(), /[?&]ch=kan11/);
  await desktop.getByRole('button', { name: 'כאן 11 לא זמין כרגע' }).waitFor();
  step('desktop: unreachable channel shows the error state and is marked in the list');

  // Kept on the list without a link: marked before anyone tries, and nothing to retry.
  await desktop.getByRole('button', { name: 'Fox News לא זמין כרגע' }).waitFor();
  await desktop.getByRole('button', { name: 'Fox News לא זמין כרגע' }).click();
  await desktop.getByRole('alert').getByText('אין כרגע קישור לשידור').waitFor();
  assert.equal(await desktop.getByRole('button', { name: 'נסה שוב עכשיו' }).count(), 0);
  await desktop.getByRole('button', { name: 'כאן 11 לא זמין כרגע' }).click();
  step('desktop: a channel with no link is shown as unavailable, without retries');

  await desktop.keyboard.press('ArrowDown');
  // N12 has no link, so stepping skips it.
  await desktop.getByRole('heading', { name: 'רשת 13' }).waitFor();
  await desktop.keyboard.press('Digit1');
  await desktop.getByRole('heading', { name: 'כאן 11' }).waitFor();
  step('desktop: keyboard switches channels');

  // The player's own controls (Video.js), not the browser's, labelled in the site's language.
  assert.equal(await desktop.locator('video[controls]').count(), 0, 'no browser controls');
  await desktop.locator('[data-media-container], video').first().waitFor();
  step('desktop: the player uses its own controls');

  // The system's media controls (lock screen, headphones) show the channel and switch it.
  const mediaTitle = () => desktop.evaluate(() => navigator.mediaSession.metadata?.title);
  assert.equal(await mediaTitle(), 'כאן 11');
  await desktop.evaluate(() => window.__mediaActions.nexttrack());
  await desktop.getByRole('heading', { name: 'רשת 13' }).waitFor();
  assert.equal(await mediaTitle(), 'רשת 13');
  await desktop.evaluate(() => window.__mediaActions.previoustrack());
  await desktop.getByRole('heading', { name: 'כאן 11' }).waitFor();
  step('desktop: media controls show the channel and switch it');

  const strip = desktop.getByRole('navigation', { name: 'החלפת ערוץ' });
  assert.equal(await strip.count(), 0, 'no channel bar over the video in the normal layout');
  await desktop.keyboard.press('KeyT');
  // Moving over the picture leaves it clear; the top of the video brings the bar.
  const video = await desktop.locator('video').boundingBox();
  await desktop.mouse.move(video.x + video.width / 2, video.y + video.height * 0.7);
  await desktop.mouse.move(video.x + video.width / 2 + 20, video.y + video.height * 0.7);
  await desktop.waitForTimeout(2500);
  await desktop.mouse.move(video.x + video.width / 2 + 40, video.y + video.height * 0.6);
  await desktop.waitForTimeout(300);
  assert.equal(await strip.isVisible(), false, 'the middle of the video does not open the bar');
  await desktop.mouse.move(video.x + video.width / 2, video.y + 20);
  await desktop.mouse.move(video.x + video.width / 2 + 20, video.y + 30);
  await strip.waitFor();
  await strip.getByRole('button', { name: 'רשת 13' }).click();
  await desktop.getByRole('heading', { name: 'רשת 13' }).waitFor();
  // The theatre button sits in the player's bar.
  await desktop.mouse.move(video.x + video.width / 2, video.y + video.height * 0.8);
  await desktop.mouse.move(video.x + video.width / 2 + 20, video.y + video.height * 0.8);
  await desktop.getByRole('button', { name: 'הצגת רשימת הערוצים (T)' }).click();
  await desktop.getByRole('button', { name: 'מצב קולנוע (T)' }).waitFor({ state: 'attached' });
  step('desktop: theatre mode shows a channel bar over the video that switches channels');

  await desktop.keyboard.press('KeyF');
  await desktop.waitForFunction(() => document.fullscreenElement !== null);
  assert.ok(
    await desktop.evaluate(() =>
      Boolean(document.fullscreenElement?.querySelector('nav[aria-label="החלפת ערוץ"]')),
    ),
    'the channel bar is inside the full-screen element',
  );
  // Streams are unreachable here, so this channel has failed: switching must still work.
  await desktop.getByRole('alert').waitFor();
  await desktop.mouse.move(600, 300);
  await desktop.mouse.move(610, 310);
  await desktop.getByRole('button', { name: 'הערוץ הבא' }).click();
  await desktop.getByRole('heading', { name: 'עכשיו 14' }).waitFor();
  await desktop.keyboard.press('KeyF');
  await desktop.waitForFunction(() => document.fullscreenElement === null);
  step('desktop: full screen keeps the channel bar, and channel switching on a failed channel');

  await desktop.getByRole('button', { name: 'הוספת CNN International למועדפים' }).click();
  assert.equal((await sectionTitles(desktop))[0], 'מועדפים');
  step('desktop: favourites come first');

  const arabic = desktop.getByRole('button', { name: 'קיפול: בערבית' });
  await arabic.click();
  await desktop.getByRole('button', { name: 'הרחבה: בערבית' }).getByText('3 ערוצים').waitFor();
  assert.equal(await desktop.locator('#section-arabic').isHidden(), true);
  await desktop.reload();
  assert.equal(await desktop.locator('#section-arabic').isHidden(), true, 'folding is remembered');
  await desktop.getByRole('button', { name: 'הרחבה: בערבית' }).click();
  assert.equal(await desktop.locator('#section-arabic').isVisible(), true);
  step('desktop: sections fold and unfold, and it is remembered');

  assert.equal(
    await desktop
      .locator('li', { hasText: 'מכאן 33' })
      .locator('span:not(:has(span))', { hasText: /^AR$/ })
      .count(),
    1,
    'an Arabic channel among the Israeli ones is tagged',
  );
  assert.equal(
    await desktop
      .locator('li', { hasText: 'רשת 13' })
      .locator('span:not(:has(span))', { hasText: /^HE$/ })
      .count(),
    0,
  );
  step('desktop: language tags only where the section does not say it');

  // Search: "/" jumps to the box, matching is by either name, Enter plays the first.
  await desktop.keyboard.press('Slash');
  await desktop.keyboard.type('internat');
  // CNN International is a favourite by now, so it is found under favourites.
  assert.deepEqual(await sectionTitles(desktop), ['מועדפים']);
  await desktop.getByRole('button', { name: 'CNN International', exact: true }).waitFor();
  await desktop.keyboard.press('Enter');
  await desktop.getByRole('heading', { name: 'CNN International' }).waitFor();
  await desktop.getByRole('searchbox', { name: 'חיפוש ערוץ' }).fill('zzz');
  await desktop.getByText('לא נמצא ערוץ בשם הזה').waitFor();
  await desktop.getByRole('searchbox', { name: 'חיפוש ערוץ' }).press('Escape');
  assert.equal((await sectionTitles(desktop)).length > 3, true, 'Escape clears the search');
  step('desktop: channel search');

  await desktop.getByRole('button', { name: 'על האתר' }).click();
  const about = desktop.getByRole('dialog', { name: 'ברוכים הבאים ל-OnAir' });
  await about.waitFor();
  await about.getByRole('heading', { name: 'קיצורי מקלדת' }).waitFor();
  await about.getByText('תשעת הערוצים הראשונים').waitFor();
  await about.getByRole('button', { name: 'סגירה' }).click();
  await about.waitFor({ state: 'hidden' });
  step('desktop: the about window explains the site and lists the shortcuts');

  // Several channels at once: picking from the list adds to the grid; one is heard.
  await desktop
    .getByRole('button', { name: /^כאן 11/ })
    .first()
    .click();
  await desktop.getByRole('button', { name: 'צפייה מרובה' }).click();
  await desktop.locator('aside').getByRole('button', { name: 'רשת 13', exact: true }).click();
  await desktop.getByRole('button', { name: 'הקול מרשת 13', pressed: true }).waitFor();
  await desktop.getByRole('button', { name: 'הקול מכאן 11', pressed: false }).click();
  await desktop.getByRole('button', { name: 'הקול מכאן 11', pressed: true }).waitFor();
  await desktop.getByRole('button', { name: 'הסרת רשת 13' }).click();
  assert.equal(await desktop.locator('video').count(), 1);
  await desktop.getByRole('button', { name: 'חזרה לערוץ אחד' }).click();
  await desktop.getByRole('button', { name: 'צפייה מרובה' }).waitFor();
  step('desktop: multi-view adds channels from the list, moves the sound, and ends');

  // Radio has a tab of its own: stations never mix with TV channels.
  await desktop.getByRole('tab', { name: 'רדיו' }).click();
  await desktop.getByRole('searchbox', { name: 'חיפוש תחנה' }).waitFor();
  assert.equal(await desktop.locator('aside').getByRole('button', { name: 'כאן 11' }).count(), 0);
  await desktop.locator('aside').getByRole('button', { name: 'רדיו 103FM', exact: true }).click();
  await desktop.getByRole('heading', { name: 'רדיו 103FM' }).waitFor();
  await desktop.getByText('בשידור').waitFor();
  assert.equal(await desktop.getByRole('button', { name: 'צפייה מרובה' }).count(), 0);
  await desktop.keyboard.press('ArrowDown');
  await desktop.getByRole('heading', { name: 'כאן גימל' }).waitFor();
  await desktop.getByRole('tab', { name: 'טלוויזיה' }).click();
  await desktop
    .locator('aside')
    .getByRole('button', { name: /^כאן 11/ })
    .first()
    .waitFor();
  assert.equal(await desktop.locator('aside').getByRole('button', { name: 'גלגלצ' }).count(), 0);
  step('desktop: radio in its own tab, a station shows its card, stepping stays in radio');

  await desktop.getByRole('button', { name: 'הוספת ערוץ משלך' }).click();
  await desktop.getByLabel('שם הערוץ').fill('בדיקה');
  await desktop.getByLabel('קישור לשידור (m3u8)').fill('http://insecure.example/a.m3u8');
  await desktop.getByRole('button', { name: 'הוספה', exact: true }).click();
  await desktop.getByRole('alert').getByText('https').waitFor();
  await desktop.getByLabel('קישור לשידור (m3u8)').fill('https://stream.example/a.m3u8');
  await desktop.getByRole('button', { name: 'הוספה', exact: true }).click();
  await desktop.getByRole('heading', { name: 'בדיקה' }).waitFor();
  step('desktop: a custom channel is validated, added and selected');

  await desktop.reload();
  await desktop.getByRole('heading', { name: 'בדיקה' }).waitFor();
  assert.deepEqual(await sectionTitles(desktop), [
    'מועדפים',
    'הערוצים שלי',
    'ישראל',
    'עולם · באנגלית',
    'בערבית',
    'שפות נוספות',
  ]);
  await desktop.getByRole('button', { name: 'מחיקת בדיקה' }).click();
  assert.deepEqual(await sectionTitles(desktop), [
    'מועדפים',
    'ישראל',
    'עולם · באנגלית',
    'בערבית',
    'שפות נוספות',
  ]);
  step('desktop: choices survive a reload; a custom channel can be deleted');

  await desktop.goto(`${url}#/admin`);
  await desktop.getByRole('heading', { name: 'הניהול לא פעיל' }).waitFor();
  step('desktop: the admin area is inert without an API');

  const sent = {
    links: ['https://stream.example/live.m3u8'],
    title: 'Test',
    page: 'https://tv.example/',
  };
  await desktop.goto(`${url}#/admin?add=${encodeURIComponent(JSON.stringify(sent))}`);
  await desktop.getByRole('heading', { name: 'הניהול לא פעיל' }).waitFor();
  step('desktop: an address from the bookmark opens the admin area');

  await desktop.goto(url);
  await desktop.getByRole('button', { name: 'Switch to English' }).click();
  assert.equal(await desktop.evaluate(() => document.documentElement.dir), 'ltr');
  assert.equal(await desktop.evaluate(() => document.documentElement.lang), 'en');
  await desktop.getByText('Israel', { exact: true }).waitFor();
  await desktop.getByRole('button', { name: 'Kan 11', exact: true }).waitFor();
  await desktop.reload();
  await desktop.getByRole('button', { name: 'החלפה לעברית' }).click();
  assert.equal(await desktop.evaluate(() => document.documentElement.dir), 'rtl');
  step('desktop: English and Hebrew, remembered across reloads');

  // ---------- Offline ----------
  // A context of its own: request interception would bypass the service worker.
  const offline = await browser.newContext({ locale: 'he-IL' });
  const off = await offline.newPage();
  off.on('pageerror', (error) => problems.push(`offline: ${error.message}`));
  await off.goto(url);
  await off.evaluate(() => navigator.serviceWorker.ready);
  await off.reload();
  await off.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // Let the logos on screen load once and be saved before going offline.
  await off.waitForFunction(async () => {
    const saved = await (await caches.open('onair-v1')).keys();
    return saved.some((request) => request.url.includes('/logos/'));
  });
  await offline.setOffline(true);
  await off.reload();
  await off.getByRole('button', { name: 'כאן 11', exact: true }).waitFor();
  const shown = await off.evaluate(() => ({
    logos: [...document.images].filter((image) => image.complete && image.naturalWidth > 0).length,
    font: document.fonts.check('16px "Heebo Variable"', 'שלום'),
  }));
  assert.ok(shown.logos > 0, `logos show offline: ${JSON.stringify(shown)}`);
  await offline.close();
  step('offline: the site opens from the saved copy, with its logos');

  // ---------- Phone ----------
  const phone = await open({ ...devices['iPhone 13'], locale: 'he-IL' }, 'phone');
  await phone.goto(`${url}?ch=cnn-international`);
  await phone.getByRole('heading', { name: 'CNN International' }).waitFor();
  step('phone: a shared link opens its channel');

  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.equal(overflow, 0, 'the page has no sideways scroll');
  const smallTargets = await phone.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((button) => button.offsetParent && button.getBoundingClientRect().height < 36)
      .map((button) => button.getAttribute('aria-label') || button.textContent),
  );
  assert.deepEqual(smallTargets, [], 'every button is a comfortable tap target');
  step('phone: fits the width, comfortable buttons');

  await phone.evaluate(() => document.querySelector('video').parentElement.requestFullscreen());
  await phone.waitForFunction(() => document.fullscreenElement !== null);
  await phone.locator('video').tap({ force: true });
  assert.equal(
    await phone.getByRole('navigation', { name: 'החלפת ערוץ' }).count(),
    0,
    'no channel bar in full screen on a touch screen',
  );
  step('phone: no channel bar in full screen');

  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  assert.deepEqual(problems, [], 'no page errors');
  console.log('\nSmoke test passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
