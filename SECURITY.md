# Security

What there is to protect, what the site stores and talks to, and how each threat is answered.
Update it whenever any of these change (CLAUDE.md, section 3, "Record").

## What is stored

- **In each viewer's browser:** the last channel, favourites, their own channels, a copy
  of the channel list, the moment being watched on channels they rewound (for up to 12
  hours), the channels in multi-view, and a saved copy of the site's own files (`public/sw.js`: the page,
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

Keys in each viewer's browser (`localStorage`), each parsed and checked when read back, never
cast: `live-video:active-channel`, `:favorites`, `:custom-channels`, `:collapsed-sections`,
`:language`, `:theme`, `:big-screen`, `:resume` (the setting), `:remote-channels`, `:logo-tints`, `:resume`, `:multi-view`, and in the admin's browser only
`:admin-token`.

## Hosts

| Host                                         | Why                                                                                      | Who            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------- |
| `matan0810.github.io`                        | The site itself (GitHub Pages)                                                           | every viewer   |
| The Worker (`live-video-api…workers.dev`)    | The channel list, reports, the admin API                                                 | every viewer   |
| Stream hosts (any https)                     | The channels' video and the radio stations' audio; viewers can add channels of their own | every viewer   |
| `mass.mako.co.il`                            | A playback ticket for `mako:` links (N12)                                                | those watching |
| Logo hosts                                   | Only until Sync channels copies a logo in (Known limits)                                 | every viewer   |
| `iptv-org.github.io`                         | The public stream directory, for the link finder                                         | the admin only |
| Cloudflare Browser Run, pages being searched | The link finder, from the Worker                                                         | the admin only |

The Content Security Policy (`vite.config.ts`) holds the site to this: scripts, styles and
fonts from the site only, no inline script, Trusted Types refusing any HTML written from
code (`src/trustedTypes.ts`). Video, playlists, requests and images may go to any https host,
because stream and logo hosts are not a closed list. A new kind of host needs a reason, a
change to the policy and a line here.

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

## Threats and what answers them

| Threat                                      | Answer                                                                                                      | Checked by                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Script injection (XSS)                      | Viewer and channel text rendered as React text; CSP allows only the site's scripts; Trusted Types on        | e2e: CSP present, no violations; unit (`trustedTypes.test.ts`)                |
| A forged or stolen admin session            | Signed tokens, 30-day expiry, all revoked by a new password                                                 | unit (`worker/src/index.test.ts`: every admin endpoint refuses)               |
| Guessing the admin password                 | Five tries per minute and per 15 minutes; constant-time compare                                             | unit (`index.test.ts`: lockout)                                               |
| A malicious channel list or report          | Validated against closed lists, lengths capped, links https only                                            | unit (`parseChannels.test.ts`, `reports.test.ts`, `index.test.ts`)            |
| A flood of reports                          | Three per address per minute, counted without writing to KV                                                 | unit (`index.test.ts`)                                                        |
| The Worker used to fetch arbitrary pages    | Admin only, https only, time, size and daily browser limits                                                 | unit (`index.test.ts`: link finder)                                           |
| Tampered data on the device or from the API | Parsed and checked; a bad value means the default                                                           | unit (`customChannels`, `resumePositions`, `linkStatus`, `listVersion` tests) |
| A logo that runs script                     | Copied in only as a real image, an SVG without scripts or outside references                                | unit (`scripts/logoFiles.test.ts`)                                            |
| A compromised dependency                    | Few runtime dependencies; `npm audit` blocks high advisories; no install scripts (`.npmrc`)                 | CI                                                                            |
| A compromised workflow step                 | Least permissions per workflow; checkouts keep no token; Cloudflare secrets only in the steps that use them | review                                                                        |
| A forged release                            | Releases only from the deploy workflow; version, commit and date checked                                    | unit (`scripts/changelog.test.ts`)                                            |

Downloads: the site offers none, so file-name and CSV-formula rules do not apply.

## Known limits, accepted

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
- GitHub Pages sends no headers, so the policy is a `<meta>` tag and cannot forbid framing.
- The policy lets video, requests and images reach any https host (stream and logo hosts are
  not a closed list), so it guards against foreign scripts, not against a request leaving
  the site.
- Every Pages project of an account shares one origin (`matan0810.github.io`), and with it
  `localStorage`. A custom domain would give the site an origin of its own.

## Repository settings

Recommended, set by the owner on GitHub (Settings of the repository): Dependabot alerts and
security updates, secret scanning with push protection and CodeQL default setup (under
"Advanced Security"); a ruleset that blocks force pushes and deletion on `master` and `dev`
(under "Rules"); and read-only workflow permissions (under "Actions", "General"), since every
workflow that writes asks for it itself.

## Reporting

Open an issue on the repository, or tell the owner directly.
