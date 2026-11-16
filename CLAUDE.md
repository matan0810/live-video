# Live Video: working procedure

A personal site for watching live news channels on one page: a static React site on GitHub
Pages, with an optional Cloudflare Worker for the remote channel list, viewer reports and
the admin area. Live at https://matan0810.github.io/live-video.

This file is binding. Follow it on every task, in every session.

## 1. Ground rules

- The owner writes in Hebrew. Answer in Hebrew.
- Everything in the repository is in English: docs, code comments, commit messages.
  The only Hebrew is interface text and channel names.
- Keep the site simple. A new feature earns a control only if it cannot be a default.
- `master` is production: every push to it deploys the site. **Nothing reaches `master`
  until the owner says so.** A request to fix or build something is not a request to deploy it.
- Never rewrite published history: no force push, no rebase of `master`.
- No model names or IDs in commits, docs or code.
- No secrets in the repository. The admin password is a Cloudflare secret.

## 2. Doing a task

1. **Understand.** Restate the request in one or two lines. If something is genuinely the
   owner's decision (look, scope, which channels), ask before building.
2. **Build** on a working branch, in small commits that each leave the checks green.
3. **Test.** All of these, every time:
   - `npm run check` passes (types, ESLint, Prettier, unit tests).
   - New logic gets a unit test next to it (`*.test.ts`).
   - Any UI change is checked in a real browser: `npm run build && npm run e2e` (extend
     `tests/e2e/smoke.mjs` for new screens or flows), and look at screenshots: desktop
     1280×800 and a 390px phone, no page errors.
   - Player changes are checked against a real or simulated live stream: playback, rewind,
     back to live, a failing source. Cloud sessions cannot reach the real channels; say so.
   - Worker changes are covered in `worker/src/index.test.ts` and, when they touch the
     site, tried against `npm run worker:dev`.
4. **Record.** Add a line under `## [Unreleased]` in `CHANGELOG.md` for every change a
   viewer or the owner would notice. Update `SECURITY.md` when what is stored or protected
   changes, and `README.md` when setup, commands or layout change.
5. **Commit and push** the working branch.
6. **Report** to the owner in Hebrew: what changed, what was tested and how, what was not
   tested, and anything they need to do by hand. Say plainly that it is not live.

### Definition of done

Checks green, browser checked when the UI changed, CHANGELOG updated, pushed, CI green,
owner told.

### Commits

- Imperative subject under 72 characters: `Add channel reports`, `Fix rewind at the window edge`.
- A blank line and a short body when the reason is not obvious.
- One topic per commit.

## 3. Code

- TypeScript in strict mode. No `any`, no non-null assertions; validate data that comes
  from outside (storage, the API, the stream directory) instead of casting it.
- Code layout is whatever Prettier produces. Comments say why, not what.
- One component per file, named like the file. Split a component that grows past about
  150 lines. Logic lives in hooks and plain modules, not in components.
- Styles are CSS Modules using the tokens in `src/styles/global.css`, with logical
  properties (`inline-start`, not `left`) so right-to-left works without special cases.
- `shared/` must stay free of DOM and Worker APIs: the site and the Worker both import it.
- Buttons have a visible label or an `aria-label`; interactive elements are real
  `<button>`s and `<a>`s.

## 4. Security rules

- Validate every value from a client on the Worker against a closed list; cap every length.
- Render viewer text as React text (`{note}`), never with `dangerouslySetInnerHTML`.
- Every admin endpoint calls `requireAdmin` first, and has a test that it refuses
  unauthenticated requests.
- Stream links must be https.
- A new external host the site talks to needs a reason, and a line in `SECURITY.md`.

## 5. What CI runs

`.github/workflows/checks.yml`, on every push to a working branch, every pull request, and
again on `master` before a deploy:

| Job                                    | What it proves                               |
| -------------------------------------- | -------------------------------------------- |
| Types, lint, format, audit, unit tests | `npm audit` (high and up), `npm run check`   |
| Browser smoke test                     | `npm run e2e` in Chromium: desktop and phone |

A new check belongs in `checks.yml`, so branches and `master` can never drift apart.

## 6. Deploying

- **Site:** merging to `master` deploys it (`deploy.yml`). Only on the owner's order.
- **Worker:** deployed by the owner from their machine with `npm run worker:deploy`. Cloud
  sessions have no Cloudflare access; when the Worker changes, tell the owner to deploy it,
  and whether the site or the Worker must go first.
- **Something is wrong in production:** revert the offending commits on a branch and ask
  the owner to merge. For the channel list, the previous version is kept in KV under
  `channels:previous`. Never reset or force-push `master`.

## 7. Dependency updates

Dependabot opens monthly pull requests. When the owner asks to handle them: read the
changelog of the update, run `npm run check` and `npm run e2e`, and note it in the
CHANGELOG if it matters to viewers. `playwright` is pinned to the version preinstalled in
cloud sessions; do not upgrade it alone.
