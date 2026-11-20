# OnAir

A personal site for watching live news channels, Israeli and international, on one page:
no ads, no sign-up. The interface is in Hebrew.

Live at https://matan0810.github.io/live-video

## Features

- Hebrew and English, with the page direction following the language.
- One click to switch channel; the last channel is restored on the next visit.
- Rewind on streams that keep past segments, with a button back to live.
- Automatic fallback to a backup link, and automatic retry when a channel is down.
- Favourites, and your own channels from an m3u8 link (kept in the browser only).
- In full screen and theatre mode, a channel row slides in over the video on mouse movement.
- A share link per channel (`?ch=kan11`), picture-in-picture, installable as an app.
- Viewers can report a broken channel or suggest a new link.
- An admin area (`#/admin`, password protected) to edit channels and handle reports
  without a deploy, and to find a channel's stream link from its own web page.

## Keyboard

| Key     | Action                                             |
| ------- | -------------------------------------------------- |
| `1`–`9` | Channel by its position in the list                |
| `↑` `↓` | Previous / next channel                            |
| `←` `→` | 10 seconds back / forward (when the stream allows) |
| Space   | Pause / resume                                     |
| `F`     | Full screen                                        |
| `M`     | Mute                                               |
| `P`     | Picture-in-picture                                 |
| `T`     | Theatre mode                                       |

## Running locally

Needs Node 22.18 or newer.

```bash
npm install
npm run dev
```

| Command                 | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Dev server on http://localhost:5173                             |
| `npm run build`         | Type check, then build into `dist/`                             |
| `npm run check`         | Types, ESLint, Prettier and unit tests; must pass before a push |
| `npm run e2e`           | Browser smoke test (needs a prior `npm run build`)              |
| `npm run format`        | Rewrite files with Prettier                                     |
| `npm run check:links`   | Check that every stream in `channels.json` answers              |
| `npm run bump -- minor` | Prepare a release: version and CHANGELOG (see CLAUDE.md)        |
| `npm run worker:dev`    | Run the Worker locally on http://localhost:8787                 |
| `npm run worker:deploy` | Deploy the Worker to Cloudflare                                 |

## Channels

A channel looks like this:

```json
{
  "id": "kan11",
  "name": "כאן 11",
  "short": "11",
  "group": "israel",
  "sources": ["https://example.com/primary.m3u8", "https://example.com/backup.m3u8"]
}
```

| Field     | Meaning                                                                                     |
| --------- | ------------------------------------------------------------------------------------------- |
| `id`      | Unique and permanent: lowercase letters, digits and dashes                                  |
| `name`    | The name shown                                                                              |
| `nameEn`  | Optional English name, when it differs from `name`                                          |
| `short`   | Short label for the channel tile (`11`, `CNN`)                                              |
| `logo`    | Optional logo: `logos/<file>` from `public/logos`, or an https address                      |
| `group`   | `israel`, `world`, `arabic` or `languages`                                                  |
| `sources` | https HLS (`.m3u8`) links in priority order: primary first, then backups; or a `mako:` path |

There are two ways to change the list:

1. **Admin area** (once the Worker is set up): open `#/admin`, edit, save. The site picks
   the change up within a minute, with no deploy. Each link can be tested before saving.
2. **The file** [`src/channels/channels.json`](src/channels/channels.json): the list the
   site is built with, used until the admin saves a list and whenever the Worker cannot be
   reached. An invalid file fails the checks and is not deployed.

Once a list is saved in the admin area it takes precedence over the file. The two are
kept in step both ways:

- **Admin → code:** the _Sync channels_ workflow (`.github/workflows/sync-channels.yml`,
  weekly and by hand from the Actions tab) copies the saved list into `channels.json` on
  `dev`, after every check passes. The next release then ships it as the fallback, and git
  keeps its history. It needs the `API_URL` variable, as the deploy does.
- **Code → admin:** when a release adds or changes a channel in `channels.json`, the admin
  area shows it under "ערוצים מעדכון האתר", to accept into the live list or decline.

## Setting up the Worker

The Worker (`worker/`) is optional. Without it the site is fully static and the report
button and admin area are hidden. It runs on Cloudflare's free plan and is deployed by the
**Deploy Worker** workflow, so everything below can be done from a phone browser.

1. Create a free account at https://dash.cloudflare.com. Open **Workers & Pages** once and
   pick a `workers.dev` subdomain when asked.
2. Copy the **Account ID** (on the account home page, or in the Workers & Pages sidebar).
3. Create an API token: profile icon → **My Profile** → **API Tokens** → **Create Token** →
   the **Edit Cloudflare Workers** template → choose your account → **Continue to summary**
   → **Create Token**. Copy it; it is shown once.
4. In the GitHub repository: **Settings** → **Secrets and variables** → **Actions** →
   **Secrets** → **New repository secret**, three times:
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `ADMIN_PASSWORD` (long and unique;
   it is the only credential for the admin area).
5. **Actions** → **Deploy Worker** → **Run workflow**. The run creates the storage, deploys
   the Worker, sets the password, and shows the Worker's address in its summary.
6. **Settings** → **Secrets and variables** → **Actions** → **Variables** → **New repository
   variable**: name `API_URL`, value the address from step 5. (A secret with the same name works too.)
7. **Actions** → **Deploy** → **Run workflow**. The report button and `#/admin` are now active.

The admin link finder can open pages in a real browser (Cloudflare Browser Run (formerly Browser Rendering), free up
to 10 minutes a day). For that the API token also needs **Account → Browser Run (once called Browser Rendering) →
Edit**; add it under My Profile → API Tokens → the token → Edit, before the next release.

To change the password, update the `ADMIN_PASSWORD` secret and run Deploy Worker again;
every existing admin session is signed out. Later changes to `worker/` or `shared/` deploy
the Worker by themselves when they reach `master`.

From a computer, `npm run worker:dev` runs the Worker locally (put
`ADMIN_PASSWORD=...` in `worker/.dev.vars`, which git ignores).

### Token-protected channels

Keshet 12 (N12) only serves its stream with a short-lived ticket. A source written as
`mako:<path>` (see the `n12` channel) makes the player ask mako's ticket service for a
fresh ticket just before it plays (`shared/channels/sources.ts`). This runs in the
viewer's browser, so no Worker is involved. N12 only plays from Israel.

## Link checks

`.github/workflows/check-links.yml` runs `npm run check:links` daily against the list
viewers actually get: the one saved in the admin area, or `channels.json` when none is
saved or the Worker cannot be reached (the report says which). Besides whether a link
answers, it flags links that answer but cannot be watched: no sound, below 360p, HEVC
only, a recording instead of live, or a server that refuses to serve the site
(`shared/streamProblems.ts`). When a channel cannot be watched it opens an issue with a
Hebrew report, and closes it once everything works again. Channels on hosts that refuse
anyone outside Israel (`ISRAEL_ONLY_HOSTS` in `scripts/check-links.ts`) are listed
separately rather than as failures, since the check runs abroad; the admin area's link
check runs from your own browser and covers them.

## Layout

```
index.html, vite.config.ts   Vite entry page and build settings
public/                      favicon, icons, manifest.webmanifest
shared/                      code used by both the site and the Worker: channel and
                             report validation
src/channels/                channels.json, custom channels, share links
src/player/                  the player: HLS loading with fallback, rewind, controls
src/components/              channel list, dialogs, buttons, icons
src/hooks/                   catalog, favourites, custom channels, active channel, shortcuts
src/admin/                   the admin area (a separate chunk, loaded only at #/admin)
src/api/                     client for the Worker API
src/styles/                  design tokens and global styles
worker/                      Cloudflare Worker: channel list, reports, admin API, streams
scripts/                     link checker, KV setup for the Worker deploy, version
                             bump and release plan, past releases
tests/e2e/                   browser smoke test
.github/workflows/           checks.yml (shared), ci.yml, deploy.yml, deploy-worker.yml,
                             check-links.yml
```

## Branches

- `dev`: all work lands here, and CI checks every push.
- `master`: the live site. It moves only on a release, by fast-forwarding to `dev`.

## Deploying and versions

Every push to `master` runs all checks and publishes the site to GitHub Pages
(`.github/workflows/deploy.yml`). When the version in `package.json` is new, the same run
tags the commit and publishes a GitHub release with its CHANGELOG notes; see
[the releases](https://github.com/matan0810/live-video/releases). The version is shown in
the site's header. In the repository settings, under Pages, the source must
be **GitHub Actions**. The Worker is deployed by its own workflow
(`.github/workflows/deploy-worker.yml`), described above.

See [CLAUDE.md](CLAUDE.md) for the working procedure, [SECURITY.md](SECURITY.md) for what
is stored and protected, and [CHANGELOG.md](CHANGELOG.md) for what changed.
