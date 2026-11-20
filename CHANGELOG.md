# Changelog

All changes a viewer or the owner would notice are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/): fixes are patch, features are minor,
breaking changes are major.

## [Unreleased]

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
