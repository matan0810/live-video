# Changelog

All changes a viewer or the owner would notice are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/): fixes are patch, features are minor,
breaking changes are major.

## [Unreleased]

### Changed
- Admin area, much calmer on a phone: the channels are a list with a line each (logo, name, group and whether it works), with search and TV / radio / problems chips. A line opens into name, group and links; the rest is under "more details". Only one is open at a time, deleting asks twice, and a bar at the bottom shows the changes waiting, with cancel and save.

### Added
- Admin area: the save button says how many changes are waiting, "cancel changes" goes back to the saved list (it asks twice, so a stray tap loses nothing), and leaving the page with unsaved changes asks first.

### Fixed
- "Try again now" on a failed channel: on a phone the controls bar no longer sits over it and swallows taps, it shows "Trying…" for a moment when pressed, and it gives a little when tapped.

## [2.16.1] - 2026-11-27

### Added
- A link to the site shows a card in WhatsApp, Telegram and the like: the icon, OnAir, and "news channels and radio stations, live, in one place".

### Changed
- CBC Radio One, RNE Radio Nacional and Times Radio have their logos, so every world station now has one.
- Fox News is marked simply "no sound"; the "preview only" and "low quality" marks are gone, as they said nothing useful.

## [2.16.0] - 2026-11-27

### Added
- Eleven world radio stations: LBC, LBC News, Times Radio, Bloomberg Radio, WNYC, CBC Radio One, ABC NewsRadio, franceinfo, RFI, Deutschlandfunk and RNE Radio Nacional.
- A channel that works only in part says so, with an amber dot: in the list, and in full under the player. Fox News is back as its official preview (no sound, low quality), and ABC News says it is not supported only in a browser that cannot play it (HEVC).

### Changed
- Section names agree across TV and radio: "World in English" on TV, "Other languages" and "World" on radio.
- Adding your own channel: a link alone is enough (it is named after its site), and Ctrl+Enter adds it as well as Enter.

### Fixed
- On a narrow phone with the sleep timer running, "Live" in the player's bar is no longer cut: the timer shows the moon and the minutes only.
- TV mode has the TV / Radio tabs above its channel bar, and shows the bar before a channel is chosen, so every channel and station can be reached; long names take two lines.
- Muted stays muted when switching between TV and radio.
- Bloomberg plays in every browser again: its links are now Bloomberg's own, in a format all browsers play (the old ones were HEVC only).

## [2.15.0] - 2026-11-26

### Added
- Loudness levelling: switching channels no longer jumps in volume; a much louder or quieter TV channel is gently brought to the same level (Chrome on computers and Android).
- Settings (the gear in the header): language, look and TV mode, kept on the device. The language button moved here.
- A light look: it follows the device's light or dark mode, or is chosen in the settings. The player stays dark.
- TV mode, for watching on a big screen: the channel list makes way for a large player with big channel tiles under it, and everything is a step larger. In the settings, or with the B key.
- The About window offers installing the site as an app (or says how, on an iPhone), and its tips mention radio, the ⋮ menu's settings and multi-view.

### Changed
- "Live" in the player's bar sits on a faint dark pill, so it stays readable over a news ticker.

## [2.14.1] - 2026-11-26

### Fixed
- A radio station that cannot play now says so, with a retry button; the message was hidden behind the station's card.

### Changed
- A radio station shows "Connecting…" while it starts, and no longer has the big play button over its card.

## [2.14.0] - 2026-11-26

### Changed
- Radio stations are in four sections, National, Regional, Other languages and From abroad, ordered by how many listen to them (TGI survey).
- The sleep timer shows its minutes left in the player's bar while it runs, and says so when it pauses the player.

### Fixed
- On some phones, a radio station showed a rewind timeline and "−Infinity:NaN:NaN" instead of "Live".

### Added
- R switches between the TV and radio lists, and the About window lists it with the other keys.
- Leaving the site while a channel plays opens it in picture in picture, as on YouTube (in Chrome, after allowing it once).

## [2.13.0] - 2026-11-25

### Added
- Radio: 39 live stations (Kan, Galei Tzahal, Galgalatz, 103FM, Eco 99 and many more, plus BBC World Service and NPR) in a tab of their own beside TV, each with its logo. A station shows its card while it plays, and stepping stays among the stations.
- Quality in the "⋮" menu: pick a picture height, or leave it automatic (which shows what plays now).
- A sleep timer in the "⋮" menu: the player pauses after 15, 30, 60 or 90 minutes.

### Changed
- The "⋮" menu no longer says when a channel has nothing to set: rows appear only when they offer a choice.
- The live label in the player's bar starts with its red dot, a little further from the volume.

## [2.12.0] - 2026-11-22

### Changed
- The "⋮" menu is laid out as in YouTube: one row per setting with its current value, opening its list; on phones it rises from the bottom of the screen.

## [2.11.0] - 2026-11-22

### Added
- Multi-view: up to four channels at once (two on a phone), from a button under the video; one is heard, and a tap on another moves the sound.
- A channel status board at the top of the admin area: what the daily link check found, per channel, worst first.
- An "About" window, from a small "i" in the header: what the site is, a few tips and the keyboard shortcuts.
- Rewinding is remembered: after a refresh, or on coming back to a channel, playback picks up at the moment you were watching (within the last 12 hours, while the channel still keeps it).
- Playback speed (×0.5 to ×2) in the "⋮" menu on channels with rewind; faster speeds work while behind live and return to normal on catching up.
- Channel search above the list, by Hebrew or English name; "/" jumps to it and Enter plays the first channel found.
- Captions on channels that carry them (DW, NBC News, Reuters, NHK World and others), from a "⋮" menu in the player's bar.

### Changed
- The "⋮" menu is always in the same place in the player's bar; on phones it opens as a large panel across the video, and on the smallest screens it also holds picture in picture.
- The theatre-mode button moved into the player's bar, beside full screen.

### Security
- The site runs only its own scripts: a Content Security Policy with Trusted Types refuses any other script and any HTML written from code.

## [2.10.0] - 2026-11-21

### Fixed
- On a channel without rewind (such as Channel 14), the arrow keys no longer move playback back with no way to return; and the "back to live" button now works on every channel whenever you are behind.
- The channel bar over the video scrolls with the mouse wheel and has arrows at its ends, so every channel can be reached; before, a mouse could not move it.

### Changed
- The channel bar over the video no longer covers the picture whenever the mouse moves: it opens only when the pointer comes to the top of the video, is smaller, and closes sooner.
- Previous and next channel buttons are in the player's bar in every view, not only in full screen. On phones they take the place of the ±10 buttons (a double tap skips).

### Added
- The site keeps a copy of itself on the device, so it opens at once, and on a weak or missing connection (the videos themselves still need one). A new release shows on the next visit.

## [2.9.2] - 2026-11-21

### Fixed
- Far behind live, the "back to live" button grew wide enough to push the full-screen and picture-in-picture buttons off a phone's screen. On phones it now shows just the time behind ("● −2:22:53"), and on the smallest phones the ±10 buttons give way to the double tap.

## [2.9.1] - 2026-11-21

### Fixed
- The play/pause button in the middle of the video is bigger and answers to taps that land just beside it; before, a near miss counted as a tap on the video and hid the controls. It also shrinks slightly when pressed.
- Stepping through channels (the full-screen buttons, the arrow keys, the lock screen) skips channels that have no link, such as N12, instead of stopping on them.
- On a channel that fails to play, the previous and next channel buttons and the full-screen button stay, so a broken channel no longer leaves you stuck in full screen.
- A channel in a format the browser cannot play (ABC News and Bloomberg use HEVC, which most desktop browsers lack) says so within seconds and stops retrying, instead of loading for 20 seconds and retrying forever.
- When a report cannot be sent, the form says why: too many reports in a minute, no connection to the report server (a network filter or ad blocker can cause this), or the server's error code.

## [2.9.0] - 2026-11-20

### Added
- Skipping back or forward shows on the video, YouTube style: arrows and the seconds on that side, adding up when you skip again quickly.
- A big play/pause button in the middle of the video: on a phone one tap shows the controls and a second tap on it pauses or resumes; on a computer it appears while paused.

## [2.8.0] - 2026-11-20

### Changed
- A new player, built on Video.js 10: its own controls over the video, in Hebrew or English, that fade out while watching and return on any movement or tap, instead of the browser's controls plus a row of buttons under the video.
- A timeline for channels that keep past minutes: drag it to go back, with a Live button that shows how far behind you are and returns to the broadcast.
- On a phone, double-tap the left or right side of the video to jump ten seconds; full screen turns the phone sideways where the browser allows it.
- In full screen, buttons for the previous and next channel.

## [2.7.3] - 2026-11-20

### Changed
- N12 is shown as unavailable again: mako's servers refuse its stream to any site but mako's own, from Israel too.
- Al Jazeera (English and Arabic) moved to the bottom of its sections.
- Logos for LiveNOW from FOX, N12, Channel 9, NBC News, ABC News, CBS News, Kan Educational and Sky News, all stored with the site; Comedy Channel gets one too.

## [2.7.2] - 2026-11-20

### Added
- N12 is back: mako gives its playback ticket to the site again. It plays only from Israel, so it could not be tried from the cloud.
- Bloomberg is back, in HEVC (most devices play it; others are told their browser cannot).
- Kan Educational and Sky News are back on the list, marked as unavailable until a working link is added in the admin area.
- Logos for Bloomberg, Channel 16 and 24 Horas, stored with the site.
- The weekly Sync channels workflow copies any logo still loaded from another host into the site, so the remaining ones (Channel 9, NBC, ABC, CBS, N12, Channel 16, 24 Horas) follow without a manual step.

## [2.7.1] - 2026-11-20

### Fixed
- Signing in to the admin area no longer hangs when Cloudflare's rate limiter is slow or failing at the nearest location: the Worker waits at most a second for it (the 15-minute login limit still applies). The login screen gives up after 20 seconds and says whether the server did not answer, the connection failed, or which error it returned.
- Channel changes in a release reach viewers at once. Until now the list saved in the admin area kept overriding them until each change was accepted there, so the new channels, logos and link fixes of 2.7.0 never appeared. A saved list now records the site version it was saved on; a newer release brings its own list (the admin's list is copied into it before every release), and the next save in the admin area wins again.
- Channel logos are stored with the site instead of loading from Wikimedia, which had started refusing many of them, so most channels showed no logo.

### Removed
- The admin area's "channels from the site update" panel, which the fix above makes unnecessary.

## [2.7.0] - 2026-11-20

### Added
- i24NEWS English, with a backup link on a second server.
- LiveNOW from FOX, Fox's free live news channel.
- An important channel with no working link stays on the list, marked as unavailable, instead of being removed; a link can be added to it in the admin area. Fox News is kept this way, since it has no free official stream.
- When a browser cannot play a channel's video format, the player says so and suggests another browser or device.
- The phone's lock screen and the system's media controls show the channel playing and its logo; their previous and next buttons switch channel.
- The admin editor shows each channel's tile as viewers will see it, and says when a logo address does not load. Logo changes arriving with a site update are previewed the same way.
- Channel 16's logo.

### Changed
- ABC News: its broken first link is removed. Its stream uses HEVC, which plays on most devices; the daily check now treats that as a limitation, not a failure.
- Reuters: a server that allows playing from the site comes first, with two backups.
- i24NEWS (Hebrew) no longer falls back to the English broadcast.
- The player rides out network drops: a channel that was playing retries the same stream with growing pauses, and at once when the device is back online, instead of showing "unavailable". Video that freezes without an error is restarted after 15 seconds.
- The player never downloads a higher quality than its size on screen can show, which saves data on phones.
- The page appears faster: the video library loads after it, in parallel.
- The daily link check tests the channel list saved in the admin area, which is what viewers get, instead of the copy in the site's code.
- The Worker keeps a short log in Cloudflare (each request's path, result and duration, and any error), so failures can be diagnosed. Nothing about the sender is logged.
- Viewer reports are stored one by one, so two reports sent at the same moment can no longer overwrite each other, and they delete themselves after 90 days. Existing reports are carried over.
- Login attempts, reports and link searches are limited per minute by Cloudflare's own rate limiter, which stores nothing, so a flood of requests cannot use up the storage allowance the admin's saves need.
- The daily link check also catches links that answer but cannot be watched (no sound, below 360p, HEVC only, a recording, or a server that refuses the site), reports in Hebrew, and lists Kan's channels as not checkable from abroad instead of as broken.

## [2.6.0] - 2026-11-19

### Added
- Channel 16, with its Hebrew and English names.

### Fixed
- Saving in the admin area no longer drops every channel's logo and language tag. The editor now shows both, and channels that lost them appear under "ערוצים מעדכון האתר", to restore in one step.
- The admin area always loads the current channel list, not the browser's copy from up to a minute earlier, so a save never overwrites newer changes.
- Updating a channel from "ערוצים מעדכון האתר" keeps it where it is in the list instead of moving it to the top.

## [2.5.0] - 2026-11-19

### Added
- The admin link finder works in stages: the page source, then the players it embeds, then a real browser in the cloud that opens the page, starts the player and records the playlist it requests, and finally the iptv-org directory for the same website. Each link shows where it was found, its best quality, whether it is a recording, and a warning when it carries a short-lived token.

- A bookmark for the admin area: on any channel's website, while its video plays, tapping the bookmark sends the stream links the page loaded to the admin area, where they are checked and can become a channel in one tap. It works for sites that hide their links from the cloud.
- The admin area shows channels added or changed in the site's code with a release, to add to the live list or ignore.
- A weekly _Sync channels_ workflow copies the list saved in the admin area into the site's code on `dev`, so the code keeps a versioned record of it and each release ships it as the fallback.

### Changed
- The admin link finder explains when a page hides its stream address (many players fetch it only once they start), and then offers the streams the iptv-org directory lists for the same website, with short steps for finding the link in the browser's developer tools.

## [2.4.0] - 2026-11-19

### Added
- Channel sections fold and unfold from their heading, and the choice is remembered. A folded section shows how many channels it holds, and says so when the channel playing is inside it.
- A small language tag (AR, RU, FR…) on channels whose language differs from their section, such as Makan 33 among the Israeli channels.

### Changed
- Channels are organised into Israel, World in English, In Arabic, and Other languages, ordered by prominence.

### Removed
- Bloomberg: its stream uses a video packaging browsers outside Safari cannot play.

## [2.3.0] - 2026-11-19

### Changed
- Logo tiles are tinted with each logo's own colour instead of plain white, so channels are easier to tell apart. The colour is worked out in the browser, so channels added later are tinted too; black-and-white logos keep a neutral card.

### Fixed
- The admin area stayed off when the Worker's address was saved as a repository secret rather than a variable; either works now.
- No sound on GB News, NHK World, Sky News Arabia, 24 Horas and Rai News 24, whose audio is a separate track: the player now uses the full hls.js build, which supports that.
- The Al Jazeera logo spilled out of its tile.

### Removed
- LiveNOW from FOX: its stream is blocked outside the US.

## [2.2.0] - 2026-11-19

### Added
- Link finder in the admin area: paste a channel's web page and it lists the stream links found there and in the player it embeds, each checked, with a button to start a new channel from one.
- The site is now called OnAir, in both languages.
- An English version of the site. It opens in Hebrew for Hebrew browsers and in English otherwise, and a button in the header switches language; the choice is remembered.
- Official logos for the channels.
- Eleven channels: Channel 9, Euronews, NHK World, CNA, LiveNOW from FOX, GB News, Newsmax, Al Arabiya English, and BBC News, Bloomberg and Reuters on new links.
- An "Other languages" section with leading news channels in Arabic (Al Jazeera, Al Arabiya, Sky News Arabia), French (France 24), Spanish (24 Horas, CNN en Español), German (tagesschau24), Italian (Rai News 24) and Russian (DW).

### Changed
- The channel row over the video in full screen is shown only with a mouse: on phones and tablets it was too easy to tap by accident.
- Work now lands on a `dev` branch and reaches the live site only on a release, as in KAVOOM.
- Updated GitHub Actions used by the build and deploy workflows to their latest versions.
- Search engines are asked not to index the site, which is for personal use.

### Removed
- Sky News: its stream refuses to play outside the UK.
- N12: mako now refuses its stream to any site but its own (HTTP 403, from Israel too).

## [2.1.0] - 2026-11-18

### Added
- In full screen and theatre mode, a row of channels slides in over the top of the video when the mouse moves or the screen is tapped, and fades out after three seconds. Switching channel with the keyboard shows it briefly too. Full screen now keeps the site's controls, and a double click on the video enters or leaves it.
- N12, which gets a fresh playback ticket from mako each time it starts.
- France 24.
- When a channel fails, its error message says why (for example "HTTP 403"), to make broken links easy to report.

### Changed
- New links for Kan 11, Makan 33, channel 13, channel 14, i24NEWS (Hebrew, with English as a backup), the comedy channel, CNN International, NBC News, ABC News, DW, RT and Al Jazeera: most of the old ones had stopped working. RT and channel 13 can now be rewound by hours.
- A stream that has not started after 20 seconds (for example in a format the browser cannot play) gives way to the channel's next link instead of loading forever.

### Removed
- Walla News, Kan Educational and BBC News: no working link could be found for them.

## [2.0.0] - 2026-11-17

A full rebuild of the site.

### Added
- Channel list with one-click switching, grouped into Israel and World, in a new dark design that works on desktop and phones.
- Rewind on streams that keep past segments: 60 and 10 seconds back, 10 forward, and a button back to live that shows how far behind you are.
- A channel that fails falls back to its backup link, shows a clear message when it is down and retries by itself every 15 seconds.
- Favourites, shown first in the list.
- Your own channels: add an m3u8 link with a name; kept in this browser only.
- Keyboard shortcuts for switching channels, seeking, pause, full screen, mute, picture-in-picture and theatre mode.
- A share link per channel, a picture-in-picture button, and the site can be installed as an app.
- Report button: tell the admin a channel is broken or suggest a new link.
- Admin area at `#/admin`: edit, add, remove and reorder channels, test links from the browser, handle reports, and search the iptv-org directory for replacement links. Changes go live without a deploy.
- Daily link check that opens an issue listing channels that are down.
- Each release is tagged and published on GitHub with its notes, and the version is shown in the site's header. Earlier versions, back to 2022, were reconstructed from the history and tagged too.
- Dependabot groups all updates into one monthly pull request for npm and one for GitHub Actions.
- The Worker is deployed by a GitHub workflow, so it can be set up and updated from a phone.

### Changed
- The last channel watched is restored when the site is opened.
- The player fills the available width at 16:9 instead of a fixed small size.
- Channels are defined in `src/channels/channels.json`, validated on every build.

### Removed
- The raw-link toggle; adding your own channel replaces it.

### Security
- CI blocks a deploy on high-severity advisories in the site's own dependencies, and reports advisories in build tools without blocking.
- The admin API requires a signed session, limits login attempts and validates every value it is sent. See SECURITY.md.

## [1.3.0] - 2025-02-13

### Added
- i24NEWS and BBC News.
- CNN International is back, on a new link.

### Changed
- The Knesset channel plays from a new link.

### Removed
- CNN (US) and France 24, whose links stopped working.

## [1.2.1] - 2024-12-16

### Changed
- Dependencies updated.
- The empty choice in the channel menu reads "בחר לינק" in plain italics.

## [1.2.0] - 2024-11-05

### Added
- The comedy channel (ערוץ הקומדיות).

### Changed
- Channel 13 is listed as Reshet 13; channel 14 and Sky News play from new links.

### Removed
- N12, Ynet, channel 9, the shopping channel and CNN International, whose links stopped working.

## [1.1.1] - 2024-07-16

### Security
- Dependencies updated to fix known vulnerabilities.

## [1.1.0] - 2023-12-11

### Added
- Many more channels: Ynet, Walla, channel 9, Kan Educational, the Knesset, Makan 33, the shopping channel, CNN International, NBC, Fox News, ABC, Sky News, France 24, DW, RT and Al Jazeera.
- A switch between the channel list and pasting your own link; the choice is remembered.
- Channels that only exist as a web page can be shown in an embedded frame.

### Changed
- The main button reads "בחר שידור".

## [1.0.0] - 2023-11-22

### Changed
- Rebuilt on Vite instead of Create React App, and published at https://matan0810.github.io/live-video.
- The player is larger on desktops and smaller on phones.
- CBS replaces N12 and Sky News, whose links stopped working.

## [0.2.0] - 2023-10-31

### Added
- A channel menu: Kan 11, N12, channel 13, channel 14, CNN and Sky News, without pasting links.
- The site is published on GitHub Pages.

## [0.1.0] - 2022-09-24

### Added
- First working version: paste an HLS (m3u8) link and watch it in a player with Hebrew controls.
- The link is remembered between visits, and a button clears it to choose another.
