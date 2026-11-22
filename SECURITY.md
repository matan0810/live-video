# Security

## What is stored

- **In each viewer's browser:** the last channel, favourites, their own channels, a copy
  of the channel list, the moment being watched on channels they rewound (for up to 12
  hours), and a saved copy of the site's own files (`public/sw.js`: the page,
  its scripts, styles, fonts, icons and logos), so it opens at once. The saved copy holds
  nothing from other hosts: no video, nothing from the Worker. Nothing about a viewer is
  sent anywhere unless they file a report.
- **In the Worker's storage (Cloudflare KV):** the channel list and its previous version,
  and viewer reports: channel, reason, optional note, optional suggested link and the time.
  Each report is its own entry and deletes itself after 90 days; the admin sees the newest 200. There are no accounts and no viewer identifiers.
  The latest daily link check (channels, their public stream links and what was found),
  written by the Check links workflow and readable only through the admin API. The
  workflow gets the Cloudflare secrets in its saving steps only, not in the step that
  fetches streams, and the admin area validates what it reads before showing it.
- **Addresses:** a login attempt stores a salted hash of the sender's address as a
  rate-limit counter, which expires after 15 minutes. Per-minute limits (logins, reports,
  link searches) use Cloudflare's rate limiter, which keeps a salted hash in memory and
  stores nothing. Raw addresses are never stored.
- The admin's session token is kept in the admin's browser.
- **Worker logs (Cloudflare Workers Logs):** one line per request with its method, path,
  status and duration, plus error messages. No addresses, tokens, queries or bodies.
  Cloudflare's automatic request log, which would include headers, is turned off. Logs
  are kept for Cloudflare's retention period (a few days on the free plan).

## What is protected

- **Admin API:** every admin endpoint requires a session token. Tokens are signed with the
  admin password, expire after 30 days, and are all invalidated by changing the password.
  The password is a Cloudflare secret; it is not in the repository or the site.
- **Login:** five attempts per address per minute and per 15 minutes; passwords and signatures are
  compared in constant time.
- **Input:** channel lists and reports are validated on the Worker against the same rules
  as the site (`shared/`). Stream links must be https. Report text is length-limited and
  stripped of control and text-reordering characters, and is rendered as plain text.
  Request bodies are size-capped.
- **Reports:** three per address per minute. The limit writes nothing to KV, so a flood of
  requests cannot use up KV's daily write allowance, which the admin's saves need.
- **Link finder:** only a signed-in admin can make the Worker fetch a web page. It accepts
  https addresses only, gives up after 10 seconds, reads at most 2 MB per page, follows at
  most three embedded players, and allows ten searches a minute. When a page holds no link,
  the Worker may open it in Cloudflare Browser Run for up to 25 seconds, at most 15
  times a day, recording only the addresses of HLS playlists the page requests. The
  browser identifies itself as automated; sites that refuse automated browsers are not
  worked around.
- **Bookmark:** the admin area's bookmark runs only when the admin clicks it, in their own
  browser on the page they are viewing. It reads the addresses of https HLS playlists that
  page loaded and opens the admin area with them in the address's `#` part, which browsers
  never send to a server. The admin area accepts at most 20 such links, validates each, and
  removes them from the address once read.
- **Browsers:** the API answers cross-origin requests only for the origins listed in
  `ALLOWED_ORIGINS` (`worker/wrangler.jsonc`).

## Known limits

- The admin area has one shared password and no second factor. Use a long, unique one.
- Rate limits are approximate (Cloudflare's limiter counts per location, and KV is eventually
  consistent), and they key on the address Cloudflare reports. They slow abuse down; they do not make it impossible.
- The CORS allowlist stops other websites from using the API in a browser. It does not
  stop direct requests, so reports can still be sent by scripts, within the rate limit.
- The admin token lives in browser storage: anyone with access to the admin's unlocked
  browser profile can use it until it expires.
- Channel logos are stored with the site (`public/logos`). A logo added with an address
  on another host loads from there, and that host sees the viewer's address, until the
  Sync channels workflow copies it in (`scripts/copy-logos.ts`). A copy must be a real
  image by its content, at most 300 KB, and an SVG must contain no scripts, event handlers
  or outside references, since one opened directly would run on the site's origin.
- To play N12 the browser asks `mass.mako.co.il` for a playback ticket. The request
  carries only the stream path, nothing about the viewer.
- Streams come from third parties. The site plays them as they are and has no control over
  their content or availability.
