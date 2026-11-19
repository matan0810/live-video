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
  step('desktop: channel list, empty state and version');

  await desktop.getByRole('button', { name: 'כאן 11', exact: true }).click();
  await desktop.getByRole('alert').getByText('כאן 11 לא זמין כרגע').waitFor();
  assert.match(desktop.url(), /[?&]ch=kan11/);
  await desktop.getByRole('button', { name: 'כאן 11 לא זמין כרגע' }).waitFor();
  step('desktop: unreachable channel shows the error state and is marked in the list');

  await desktop.keyboard.press('ArrowDown');
  await desktop.getByRole('heading', { name: 'רשת 13' }).waitFor();
  await desktop.keyboard.press('Digit1');
  await desktop.getByRole('heading', { name: 'כאן 11' }).waitFor();
  step('desktop: keyboard switches channels');

  const strip = desktop.getByRole('navigation', { name: 'החלפת ערוץ' });
  assert.equal(await strip.count(), 0, 'no channel bar over the video in the normal layout');
  await desktop.keyboard.press('KeyT');
  await desktop.locator('video').hover({ force: true });
  await strip.waitFor();
  await strip.getByRole('button', { name: 'רשת 13' }).click();
  await desktop.getByRole('heading', { name: 'רשת 13' }).waitFor();
  await desktop.keyboard.press('KeyT');
  step('desktop: theatre mode shows a channel bar over the video that switches channels');

  await desktop.keyboard.press('KeyF');
  await desktop.waitForFunction(() => document.fullscreenElement !== null);
  assert.ok(
    await desktop.evaluate(() =>
      Boolean(document.fullscreenElement?.querySelector('nav[aria-label="החלפת ערוץ"]')),
    ),
    'the channel bar is inside the full-screen element',
  );
  await desktop.keyboard.press('KeyF');
  await desktop.waitForFunction(() => document.fullscreenElement === null);
  step('desktop: full screen keeps the channel bar');

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
      .locator('span', { hasText: /^AR$/ })
      .count(),
    1,
    'an Arabic channel among the Israeli ones is tagged',
  );
  assert.equal(
    await desktop.locator('li', { hasText: 'רשת 13' }).locator('span', { hasText: /^HE$/ }).count(),
    0,
  );
  step('desktop: language tags only where the section does not say it');

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
