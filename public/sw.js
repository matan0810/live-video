// Service worker: keeps a copy of the site on the device, so it opens at once and works
// on a weak connection. It also lets the browser offer "install app" (no button of ours).
// Live video always comes from the network: streams and the Worker API are other origins,
// which this worker never touches.
//
// - The page itself is taken from the network when it answers within 2.5 seconds, so a
//   release shows on the next visit; otherwise the saved copy is used.
// - Files in assets/ carry a hash of their content in the name and never change, so a
//   saved copy is always right. Those the page loads later (the video library, the admin
//   area) and channel logos are saved the first time they are used.
// - A page is saved only if it really is the site (it has the app's root element and
//   script), so an error page from the host never replaces it.

const CACHE = 'onair-v1';
const SCOPE = new URL(self.registration.scope).pathname; // e.g. /live-video/
const PAGE = SCOPE;
const EXTRAS = ['favicon.svg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'].map(
  (file) => SCOPE + file,
);
const PAGE_WAIT_MS = 2500;
// Servers mark files as varying by headers such as Origin, which differ between how a file
// was saved and how the page asks for it (a module script sends an Origin). The saved
// files never change, so the stored copy is always right.
const MATCH = { ignoreVary: true };

function assetsOf(html) {
  const pattern = new RegExp(`(?:src|href)="(${SCOPE}assets/[^"]+)"`, 'g');
  return [...html.matchAll(pattern)].map((m) => m[1]);
}

// Fonts a stylesheet points at, so the saved copy keeps its look offline.
function urlsInCss(css) {
  const pattern = new RegExp(`url\\(["']?(${SCOPE}assets/[^"')]+)["']?\\)`, 'g');
  return [...css.matchAll(pattern)].map((m) => m[1]);
}

function isSitePage(html) {
  return html.includes('<div id="root">') && assetsOf(html).length > 0;
}

// Save a fresh page with everything it needs. When a release changes the page's own
// files, drop the saved assets of the old release.
async function savePage(response, html) {
  const cache = await caches.open(CACHE);
  const assets = assetsOf(html);
  const previous = await cache.match(PAGE, MATCH);
  const isNewRelease = !previous || assetsOf(await previous.text()).join() !== assets.join();
  if (isNewRelease) {
    for (const request of await cache.keys()) {
      if (new URL(request.url).pathname.startsWith(`${SCOPE}assets/`)) await cache.delete(request);
    }
  }
  await cache.addAll([...EXTRAS, ...assets]);
  for (const sheet of assets.filter((a) => a.endsWith('.css'))) {
    const saved = await cache.match(sheet, MATCH);
    await cache.addAll(saved ? urlsInCss(await saved.text()) : []);
  }
  await cache.put(PAGE, response);
}

function fetchPage() {
  const network = fetch(PAGE, { cache: 'no-store' });
  const saved = network.then(async (response) => {
    const html = response.ok ? await response.clone().text() : '';
    if (!isSitePage(html)) throw new Error('not the site page');
    await savePage(response.clone(), html);
    return response;
  });
  return { network, saved };
}

// The fresh page if it comes in time, the saved one otherwise.
async function page() {
  const { network, saved: fresh } = fetchPage();
  const saved = await caches.match(PAGE, MATCH);
  if (!saved) return fresh.catch(() => network);
  fresh.catch(() => undefined);
  const late = new Promise((resolve) => setTimeout(() => resolve(saved), PAGE_WAIT_MS));
  return Promise.race([fresh.catch(() => saved), late]);
}

async function savedFirst(request) {
  const hit = await caches.match(request, MATCH);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(fetchPage().saved.then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' || url.pathname === PAGE) event.respondWith(page());
  else if (
    url.pathname.startsWith(`${SCOPE}assets/`) ||
    url.pathname.startsWith(`${SCOPE}logos/`) ||
    EXTRAS.includes(url.pathname)
  ) {
    event.respondWith(savedFirst(request));
  }
});
