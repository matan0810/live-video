# Changelog

All changes a viewer or the owner would notice are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/): fixes are patch, features are minor,
breaking changes are major.

## [Unreleased]

### Added
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
