# OnAir: working procedure

OnAir (repository `live-video`) is a personal site for watching live news channels on one
page: a static React site on GitHub
Pages, with an optional Cloudflare Worker for the remote channel list, viewer reports and
the admin area. Live at https://matan0810.github.io/live-video.

This file is binding. Follow it on every task, in every session.

## 1. Ground rules

- The owner writes in Hebrew. Answer in Hebrew.
- Everything in the repository is in English: docs, code comments, commit messages.
  The only Hebrew is interface text and channel names.
- Keep the site simple. A new feature earns a control only if it cannot be a default.
- `master` is production: every push to it deploys the site. **Nothing reaches `master`
  until the owner says to release** ("תעלה גרסה", "תמזג", "release", or the like). A request
  to fix or build something is not a request to release it.
- Never rewrite published history: no force push, no rebase of `dev` or `master`.
- No model names or IDs in commits, docs or code.
- No secrets in the repository. The admin password is a Cloudflare secret.

## 2. Branches

| Branch         | Role                                                                                                                            | Who writes                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `dev`          | Integration. Every task lands here. CI runs every check on every push.                                                          | Claude                          |
| `master`       | Production. Every push deploys the site and, with a new version, tags a release.                                                | Claude, only on a release order |
| `dependabot/*` | Dependency updates, opened as pull requests against `dev`.                                                                      | Dependabot                      |
| other          | A session's own working branch, when the environment gives it one. It is fast-forwarded into `dev` and is otherwise disposable. | Claude                          |

`master` is always an ancestor of `dev`: work flows `dev` → `master` by fast-forward only.

Start every session with:

```
git fetch origin dev master
git checkout dev                 # or the session's working branch, reset to origin/dev
git pull --ff-only origin dev
git log --oneline -5 origin/master
git log --oneline origin/master..origin/dev   # what is waiting for the next release
```

If `master` has commits that `dev` lacks, stop and tell the owner; that should never happen.

## 3. Doing a task

1. **Understand.** Restate the request in one or two lines. If something is genuinely the
   owner's decision (look, scope, which channels), ask before building.
2. **Build** on `dev` (or a working branch based on it), in small commits that each leave
   the checks green.
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
5. **Commit and push to `dev`.** From a working branch: push it, then
   `git push origin HEAD:dev` (a fast-forward; if `dev` moved, merge `origin/dev` first).
6. **Report** to the owner in Hebrew: what changed, what was tested and how, what was not
   tested, and anything they need to do by hand. Say plainly that it is on `dev` and not live.

### Definition of done

Checks green, browser checked when the UI changed, CHANGELOG updated, pushed to `dev`,
CI on `dev` green, owner told.

### Commits

- Imperative subject under 72 characters: `Add channel reports`, `Fix rewind at the window edge`.
- A blank line and a short body when the reason is not obvious.
- One topic per commit. Release commits are exactly `Release vX.Y.Z`.

## 4. Code

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

## 5. Security rules

- Validate every value from a client on the Worker against a closed list; cap every length.
- Render viewer text as React text (`{note}`), never with `dangerouslySetInnerHTML`.
- Every admin endpoint calls `requireAdmin` first, and has a test that it refuses
  unauthenticated requests.
- Stream links must be https.
- A new external host the site talks to needs a reason, and a line in `SECURITY.md`.

## 6. What CI runs

`.github/workflows/checks.yml`, on every push to `dev` (and any working branch), every pull
request, and again on `master` before a deploy (`ci.yml` and `deploy.yml` both call it):

| Job                                    | What it proves                                        |
| -------------------------------------- | ----------------------------------------------------- |
| Types, lint, format, audit, unit tests | `npm audit --omit=dev` (high and up), `npm run check` |
| Browser smoke test                     | `npm run e2e` in Chromium: desktop and phone          |

A new check belongs in `checks.yml`, so `dev` and `master` can never drift apart.

The audit blocks only on runtime dependencies, which ship to viewers. Advisories in build
and test tools are printed as a warning on every run: when one appears, update the tool as
soon as a fixed version exists, and never downgrade a tool to an old major to silence it.

## 7. Versions

Semantic versioning, `MAJOR.MINOR.PATCH`:

| Bump    | When                                        | Example                              |
| ------- | ------------------------------------------- | ------------------------------------ |
| `patch` | Fixes only, nothing new for viewers         | a broken link replaced, a layout bug |
| `minor` | Anything new or changed that viewers notice | a channel added, a new button        |
| `major` | A break with the past                       | saved favourites or channels reset   |

The version lives in `package.json` and `package-lock.json` (kept in step by
`npm run bump` and checked by a test) and is shown in the site's header. Past releases,
from before tags were used, are listed with their commits in `scripts/release-history.json`.

## 8. Releasing (only on the owner's order)

A release is a push to `master` whose `package.json` version has no tag yet. Once the site
is deployed, `deploy.yml` tags that commit `vX.Y.Z` and publishes a GitHub release with
the version's CHANGELOG section. It also creates any missing tag from
`scripts/release-history.json`. Tags are created only by that workflow: cloud sessions
cannot push tags, so never try.

### Before

- [ ] `dev` is pushed and CI on `dev` is green.
- [ ] `## [Unreleased]` in `CHANGELOG.md` describes everything in
      `git log origin/master..origin/dev`. If it is empty there is nothing to release: say so.
- [ ] Pick the bump by section 7 and tell the owner which one and why.

### Release

```
npm run bump -- patch|minor|major     # version files + CHANGELOG section dated today
npm run check
git commit -am "Release vX.Y.Z"
git push origin HEAD:dev              # wait for CI on dev to pass
git push origin dev:master            # must fast-forward; if it is refused, stop and report
```

### After

- [ ] The Deploy run on `master` passed every job, including `release`.
- [ ] https://github.com/matan0810/live-video/releases shows `vX.Y.Z` as the latest release.
- [ ] The live site serves the new version: its script contains `X.Y.Z` (the header shows it).
- [ ] Tell the owner: the version, the release link, what is in it, and what to check by hand.

### Changes with nothing for viewers

Docs, workflows and tooling can reach `master` without a bump, still only on the owner's
order: fast-forward `master` to `dev` as above and skip `npm run bump`. The site redeploys
and no tag is created.

## 9. Deploying

- **Site:** a push to `master` deploys it (`deploy.yml`). Only on a release order.
- **Worker:** `deploy-worker.yml` deploys it when `worker/` or `shared/` changes on
  `master`, or when run by hand. It needs the Cloudflare secrets described in README.md.
  When a change needs the Worker and the site in a particular order, say which goes first.
- The owner often works from a phone. Instructions for them must work in a browser: GitHub
  and Cloudflare settings pages, workflow runs. No terminal steps.
- **Something is wrong in production:**
  - _Rollback first:_ in the repository's Actions tab the owner can re-run the Deploy run of
    the previous release, which publishes that version again.
  - _Hotfix:_ fix on `dev` with a test that reproduces the bug, add a `Fixed` line to the
    CHANGELOG, then ask the owner for a `patch` release.
  - _Undo a release:_ `git revert` the offending commits on `dev`, then a `patch` release.
  - For the channel list, the previous version is kept in KV under `channels:previous`.
  - Never reset or force-push `master` or `dev`.

## 10. Dependency updates

Dependabot opens at most two pull requests a month against `dev`: one with every npm
update, one with every GitHub Actions update (`.github/dependabot.yml`). When the owner
asks to handle them: read the changelog of each update, merge the pull request's branch
into `dev` locally, run `npm run check` and `npm run e2e`, push `dev`, and note it in the
CHANGELOG if it matters to viewers. An update that breaks the build is not merged: add an
`ignore` for it in `dependabot.yml` with the reason, and tell the owner. `playwright` is pinned to the version preinstalled in
cloud sessions, so Dependabot ignores it; do not upgrade it alone.
