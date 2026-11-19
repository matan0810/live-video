# Security

## What is stored

- **In each viewer's browser:** the last channel, favourites, their own channels and a copy
  of the channel list. Nothing about a viewer is sent anywhere unless they file a report.
- **In the Worker's storage (Cloudflare KV):** the channel list and its previous version,
  and viewer reports: channel, reason, optional note, optional suggested link and the time.
  At most 200 reports are kept. There are no accounts and no viewer identifiers.
- **Addresses:** a report or login attempt stores a salted hash of the sender's address as
  a rate-limit counter, which expires with the limit's window (an hour for reports, 15
  minutes for logins). Raw addresses are never stored.
- The admin's session token is kept in the admin's browser.

## What is protected

- **Admin API:** every admin endpoint requires a session token. Tokens are signed with the
  admin password, expire after 30 days, and are all invalidated by changing the password.
  The password is a Cloudflare secret; it is not in the repository or the site.
- **Login:** five attempts per address per 15 minutes; passwords and signatures are
  compared in constant time.
- **Input:** channel lists and reports are validated on the Worker against the same rules
  as the site (`shared/`). Stream links must be https. Report text is length-limited and
  stripped of control and text-reordering characters, and is rendered as plain text.
  Request bodies are size-capped.
- **Reports:** ten per address per hour.
- **Link finder:** only a signed-in admin can make the Worker fetch a web page. It accepts
  https addresses only, gives up after 10 seconds, reads at most 2 MB per page, follows at
  most three embedded players, and allows 30 searches an hour. When a page holds no link,
  the Worker may open it in Cloudflare's Browser Rendering for up to 25 seconds, at most 15
  times a day, recording only the addresses of HLS playlists the page requests. The
  browser identifies itself as automated; sites that refuse automated browsers are not
  worked around.
- **Browsers:** the API answers cross-origin requests only for the origins listed in
  `ALLOWED_ORIGINS` (`worker/wrangler.jsonc`).

## Known limits

- The admin area has one shared password and no second factor. Use a long, unique one.
- Rate limits use eventually consistent storage, so they are approximate, and they key on
  the address Cloudflare reports. They slow abuse down; they do not make it impossible.
- The CORS allowlist stops other websites from using the API in a browser. It does not
  stop direct requests, so reports can still be sent by scripts, within the rate limit.
- The admin token lives in browser storage: anyone with access to the admin's unlocked
  browser profile can use it until it expires.
- Channel logos load from the image hosts named in `channels.json`, mostly Wikimedia
  (`upload.wikimedia.org`) and Imgur (`i.imgur.com`). Those sites see the viewer's address,
  as with any image on the web.
- To play N12 the browser asks `mass.mako.co.il` for a playback ticket. The request
  carries only the stream path, nothing about the viewer.
- Streams come from third parties. The site plays them as they are and has no control over
  their content or availability.
