# OnAir: design

What the site is, how it looks and the rules each part follows. Code, tests and this file
change together: a change to a rule, a number or a behaviour updates the section here.

## 1. Scope

| In                                                           | Out                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| Live news channels and radio, Israeli and international      | Recordings, programme guides, on-demand video         |
| Rewind on channels whose stream keeps past minutes           | Recording or downloading video                        |
| Hebrew (right to left) and English                           | Other interface languages                             |
| Favourites and the viewer's own channels, kept on the device | Accounts, comments, anything shared between viewers   |
| One owner who edits channels in an admin area                | More than one admin, roles                            |
| Viewer reports of broken channels                            | Replies to viewers                                    |
| Official free streams only                                   | Pirate re-broadcasts, getting around a host's refusal |
| A personal site (`noindex`)                                  | Search engines, analytics, ads                        |

## 2. Look

Dark, quiet and made for watching: the video is the brightest thing on the page.

- **Colour.** Near-black surfaces, light text, and one accent, red `#ff4654`
  (`--color-accent` in `src/styles/global.css`), used for "live", the active channel, the
  timeline's fill and primary buttons. Nothing else is red.
- **Type.** Heebo (variable), bundled with the site: no font host.
- **Channel tiles.** A logo sits on a light card tinted with the logo's own main colour
  (`src/channels/logoTint.ts`), so the list is not a column of white squares; a channel
  without a logo shows its short label on a colour derived from its id. A small language
  tag (AR, RU, FR…) appears only when the channel's language differs from its section's.
- **Direction.** Layout follows the reading direction through logical CSS properties. The
  player's control bar and timeline are the exception: they run left to right in both
  languages, as in nearly every video player, so the skip buttons agree with the timeline;
  their labels stay in the site's language.
- **Restraint.** A control earns its place only if it cannot be a default (CLAUDE.md).

- **About.** A small, borderless "i" in the header, beside the version, opens a short
  welcome: what the site is, five tips and the keyboard shortcuts (not on touch screens).
  It never opens by itself. Where the browser offers installing the site as an app (Chrome),
  it has an Install button; on an iPhone it says how (Share, then Add to Home Screen); once
  installed, neither shows.

## 3. Channel list

- **Two tabs, TV and Radio**, above the search: underlined, as in YouTube. They never mix:
  each tab has its own sections, favourites and search ("Search stations" on Radio). The
  list opens on the tab of the channel last watched, or the one a shared link opens.
- **Sections**, in this order: favourites (when there are any), the viewer's own channels,
  Israel, World in English, In Arabic, Other languages. A section folds from its heading,
  and the choice is remembered; a folded section shows how many channels it holds.
- **Search**, a box above the list ("/" jumps to it): matches either name, the short label
  or the id, ignoring case, spaces, accents and Hebrew vowel marks; every section opens
  while searching, Enter plays the first channel found and Escape clears it.
- **Order within a section** is by importance, as the owner sets it in the list.
  Al Jazeera (English and Arabic) is at the bottom of its section by the owner's choice.
- **Unavailable.** A channel is marked "unavailable" when it failed to play in this visit,
  and from the start when it has no link at all.
- **Important channels are never deleted for lack of a link.** They stay listed with an
  empty `sources` list (N12, Fox News, Kan Educational, Sky News), so a link can be added in
  the admin area. A channel the owner no longer wants is removed (Walla, TRT World).

## 4. Where the channel list comes from

- **Two lists.** `src/channels/channels.json` is built into each release. The admin area
  saves a list in the Worker's storage (KV), which reaches viewers within a minute.
- **Which one viewers get** (`shared/channels/listVersion.ts`): a saved list records the
  site version it was saved on. It wins until a newer release ships; that release's own
  list takes over at once, and the next save in the admin area wins again.
- **Nothing saved is lost:** the admin's list is copied into the code before every release
  (CLAUDE.md, section 8) and weekly by the Sync channels workflow, which copies only a list
  saved on the code's version or later.
- **Logos are stored with the site** (`public/logos`), since Wikimedia refuses hotlinked
  images. A logo added with an outside address is copied in by the Sync channels workflow
  (`scripts/copy-logos.ts`): a real image by its content, at most 300 KB, an SVG with no
  scripts or outside references.
- **Versions.** A change to channels, links or logos is a patch; a change to the site's
  behaviour that viewers notice is a minor version (CLAUDE.md, section 7).

## 5. Player

Playback is ours (`src/player/useHlsPlayer.ts`); Video.js 10 supplies the controls' state,
their auto-hiding, gestures and translated labels.

### Playing a channel

- Links are tried in order; a link that fails before playing gives way to the next, and
  only when all have failed is the channel unavailable. A `mako:` link first asks mako for
  a playback ticket.
- A link that has not started within **20 seconds** counts as failed.
- hls.js loads after the page shows. Quality never exceeds what the player's size can
  show, with very dense phone screens counted as double density.
- **A link that has played** is kept through trouble: after a network drop it is retried
  after 1, 2, 4, 8, 15, 15 and 15 seconds, and at once when the device is back online.
  Video that does not move for **15 seconds** while it should is restarted; more than
  **two restarts in five minutes** and the link counts as broken.
- An unavailable channel is retried automatically every **15 seconds**, except a channel
  with no link and one whose format the browser cannot play (HEVC in most desktop
  browsers): those say so and wait.

### Controls

- Over the video, fading after a moment without movement and back on any movement or tap.
  On touch screens one tap shows them; a tap on the video while they show hides them.
- **Big button in the middle**: shown with the controls on touch screens, and while paused
  on any screen. 76 px, answering to a ring of 24 px around it, since a near miss would hide
  the controls instead.
- **Bottom bar**, left to right: play/pause, mute (with a volume slider on hover), the live
  button, skip −10 / +10 (on rewindable channels), previous / next channel, picture in
  picture, theatre mode (wide screens, where the list sits beside the player), full screen.
  Under the video only the channel's name, share and report remain.
- **"⋮" menu**, in the bar before picture in picture, for settings few viewers need, laid out
  as in YouTube: one row per setting with its current value, each opening its list of
  choices with a way back. With a mouse it is a small pop-up inside the player; on touch
  screens a sheet rises from the bottom of the screen over a dark backdrop, in full screen
  too. A row appears only when it offers a real choice, in this order:
  - **Captions** (off by default, and back off on every channel switch) on channels that
    carry them: subtitle tracks loaded by hls.js, or captions inside the video, with track
    languages shown as names in the site's language.
  - **Playback speed** (×0.5 to ×2) on channels with rewind: faster speeds only while
    behind live, back to normal on catching up with live and on every channel switch.
  - **Quality**, when the stream offers more than one height and hls.js plays it (Safari's
    own player chooses by itself): each height once, highest first, and "Auto (720p)"
    showing what plays now. Back to automatic on every channel switch.
  - **Sleep timer**, always: off, 15, 30, 60 or 90 minutes, then the player pauses. While
    it runs, a moon and the minutes left sit in the bar beside "⋮"; when it pauses the
    player, a line over the picture says so until it plays again. It keeps running across
    channel switches.

  On the smallest screens (≤ 360 px) picture in picture moves into it.
  When a channel cannot play, only previous / next channel and full
  screen remain. On phones (≤ 480 px) the skip buttons give way to the double tap, and on
  the smallest (≤ 360 px) picture in picture too, so the row never runs off the screen.

- **Live button**: the red dot first, beside the volume, as in YouTube, on a faint dark pill
  so it reads over a ticker; "Live" at the live edge (within **15 seconds** counts as live);
  otherwise "Back to live −1:23", and a tap returns, on any channel, rewindable or not.
  Phones show the time alone.
- **Rewind** is offered when the stream keeps at least **60 seconds**. The timeline follows
  the stream's moving window (Video.js's own slider assumes history from zero) and seeks
  when the finger or mouse lets go.
- **Resume.** Watching behind live on a rewindable channel remembers the broadcast moment
  (every 5 seconds, on leaving the channel and on leaving the page). A refresh or a return
  to the channel seeks back to that moment if the stream still keeps it (10 seconds inside
  its window); otherwise, within 15 seconds of live, or after 12 hours, it starts at live.
- **Skips show on the video**, YouTube style: arrows and the seconds on that side, rounded
  to five, adding up when repeated within 1.2 seconds. Jumps under 3 or over 65 seconds
  (the timeline, back to live) are not skips.
- **Gestures**: a click pauses, a double click is full screen; on touch, a double tap on
  the left or right half skips 10 seconds.
- **Keyboard**: Space play/pause, M mute, F full screen, P picture in picture, ← / → 10
  seconds (on rewindable channels only), ↑ / ↓ previous / next channel, 1–9 the first nine channels of the open tab, T theatre mode,
  R TV or radio, / search.
- **Full screen** is the player's frame, so the site's overlays stay. With a mouse, a
  channel bar shows over the top; on touch screens it does not (too easy to tap by
  mistake). It opens only when the pointer comes to the top 30% of the video (moving over
  the picture leaves it clear) and on a channel switch, and closes 2 seconds after the
  pointer leaves. It is compact, scrolls with the mouse wheel, has arrows at its ends while
  more channels lie that way, and keeps the playing channel in view. On phones full screen turns the picture sideways where the browser allows.
- **Stepping channels** (keys, full-screen buttons, lock screen) follows the list order,
  wraps around, and skips channels with no link.
- **Loudness levelling**: switching from a quiet channel to a loud one should not jump in
  volume. While hls.js plays a TV channel, its sound is measured (the speech's level, past
  silence and pauses) and turned gently towards one level (−27 dB, where most channels sit),
  at most 0.5 dB a quarter-second, within −12 to +9 dB, with a limiter against clipping. It
  starts after the viewer's first tap or key (browsers allow no audio processing before),
  measures past the viewer's own volume and never makes up for it, and pauses with the
  video. Not on radio stations streamed directly (their sound cannot be processed, and would
  go silent; radio has an element of its own), nor on iPhones and iPads, where playing on
  with the screen locked through Web Audio is not sure. Nothing to switch on or off.
- **Leaving the site** while a picture plays opens picture in picture, as YouTube does:
  Chrome on a computer on switching tab (it asks the viewer once), Safari through the
  video's `autopictureinpicture` attribute, Android from full screen. Radio just keeps
  playing. Closing the tab ends playback; no site can keep playing after that.
- **Lock screen and media keys** show the channel and its logo; previous / next switch
  channel.

### Radio

- **Stations** are channels in four radio groups (`src/channels/channels.json`), shown only
  in the Radio tab as its sections: **National** (Galgalatz, Kan Bet, Galei Tzahal, Kan
  Gimel, then Kan's smaller stations), **Regional**, **Other languages** (Arabic, Russian;
  tagged) and **From abroad** (BBC World Service, NPR). Within National and Regional,
  stations are ordered by weekday listening in the TGI survey (July 2025 to June 2026);
  stations it does not report follow, the North's and the South's together. They came
  from a public catalog of Israeli stations (issue #12). Every station has a logo, stored with the
  site like the TV channels': the station's own site icon, its logo from Wikipedia, or from
  the OnlineRadioBox and myTuner directories. A logo that fails to load gives way to the
  station's frequency or short name.
- **Links** are HLS playlists (Kan) or plain audio streams (MP3 or AAC over Icecast), which
  the browser plays by itself: a link not ending in `.m3u8` is audio
  (`shared/channels/sources.ts`, `isHlsSource`).
- **The view**: in place of a picture, the station's tile large, its name, and a small red
  level meter that moves while it plays and rests when paused; while it connects, a small
  spinner and "Connecting…". Errors and their retry button show above the card. There is
  no big play button in the middle, which would cover the card; the bar has its own.
- **The bar** is the TV one without picture in picture, quality or multi-view, which need a
  picture; the sleep timer is there, and rewind only when an HLS stream keeps a window. A
  plain audio stream never offers rewind, however the browser reports its range (Android
  Chrome reports it as endless).
- **Stepping** (↑ / ↓, the bar's buttons, the lock screen, 1–9 within the open tab) stays
  within the kind: radio to radio, TV to TV. Picking a station during multi-view ends it.

### Multi-view

- A button under the video, beside share and report, shows up to **four** channels at once
  on screens 600 px wide and up, and **two**, one above the other, on narrower ones (a
  phone). It is a view of its own, not a channel setting, so it is not in the "⋮" menu.
- Two places side by side until a third channel joins, then two by two; a free place says
  to pick a channel from the list.
- While it is open, a channel picked anywhere (the list, search, the keys) joins the grid
  and is heard; when the grid is full it takes the place of the channel being heard.
- Only one channel plays sound, outlined in red with a speaker by its name; a tap on another
  moves the sound there. Each channel can be enlarged back to the normal player, or removed.
  "Back to one channel" returns to the normal player with the heard channel.
- Each tile picks a quality to fit its own size. It is kept on the device, so a refresh
  returns to the same grid; a narrower screen shows fewer, keeping the heard one.

## 6. Admin area

At `#/admin`, a separate chunk viewers never download. One password, a Cloudflare secret.

- **Editor**: every field of a channel, links one per line (first is primary), a logo
  preview showing the tile as viewers will see it, and a check of each link from the
  owner's own browser (a radio station's audio stream is checked by starting to play it,
  silently).
- **Link finder**, in stages, stopping at the first that finds something: the page's
  source, the players it embeds, a real browser in the cloud (Cloudflare Browser Run,
  up to 15 times a day), then the iptv-org directory for the same website.
- **Bookmark**: run on a channel's own site while it plays, it sends the stream links that
  page loaded to the admin area (`#/admin?add=…`), for sites that hide them from the cloud.
- **Channel status**, at the top: the latest daily link check, channels grouped by what
  was found, worst first. What the owner can act on (not working, not watchable, a broken
  link) is open; the other groups open from their counts. A run older than 36 hours is
  flagged, since the check should run daily.
- **Reports** from viewers, newest first, each with a suggested link when one was given.

## 7. Checks that run on their own

- **Daily link check** (`scripts/check-links.ts`) tests the list viewers get. A link can
  answer and still be useless: no sound, below 360p, a recording, or a server that refuses
  the site, which open an issue; HEVC only is a limitation, listed without an issue. A radio station's plain audio stream
  counts as working when it answers with an audio type (its headers alone are read). Kan's
  hosts refuse anyone abroad and are listed as not checkable. Channels with no link are
  listed apart. Each run is also saved to the Worker for the admin's status board.
- **Weekly Sync channels**: the admin's list and outside logos into the code (section 4).

## 8. Addresses

`?ch=<id>` opens a channel (and is what Share sends), `#/admin` the admin area, and
`#/admin?add=<links>` the admin area with links from the bookmark.

## 9. Offline copy

`public/sw.js` keeps the site's own files on the device: the page comes from the network
when it answers within 2.5 seconds, so a release shows on the next visit, and from the
saved copy otherwise. Scripts, styles and logos are saved when first used, and an old
release's files are dropped when the page's change. Streams and the Worker are other hosts
and are never touched.

## 10. Worker

A Cloudflare Worker (`worker/`) holds the saved channel list, reports and the admin API.

- Per-minute limits by Cloudflare's rate limiter, which stores nothing: logins 5, reports
  3, link searches 10; logins also 5 per 15 minutes in KV. If the limiter is slow or down,
  requests go through rather than hang.
- Each report is its own entry and expires after 90 days.
- One log line per request (method, path, status, duration) and errors; never addresses,
  tokens or bodies.
- Some browsers' tracker blocking refuses `workers.dev` addresses: on those, reports and
  the admin area fail while the site itself works (the owner's regular phone browser).
