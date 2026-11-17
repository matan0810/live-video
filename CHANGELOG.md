# Changelog

All changes a viewer or the owner would notice are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/): fixes are patch, features are minor,
breaking changes are major.

## [Unreleased]

Version 2.0.0: a full rebuild of the site.

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
