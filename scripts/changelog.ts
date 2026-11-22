/** Pure helpers for CHANGELOG.md and version numbers, shared by bump and release scripts. */

export type Bump = 'patch' | 'minor' | 'major';

export interface ReleaseSection {
  version: string;
  date: string;
  body: string;
}

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const SECTION_PATTERN = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?$/gm;

export function nextVersion(current: string, bump: Bump): string {
  const match = VERSION_PATTERN.exec(current);
  if (!match) throw new Error(`Not a MAJOR.MINOR.PATCH version: ${current}`);
  const [major, minor, patch] = match.slice(1).map(Number) as [number, number, number];
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Splits the changelog into its `## [...]` sections, in file order. */
function sections(changelog: string) {
  const headings = [...changelog.matchAll(SECTION_PATTERN)];
  return headings.map((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? changelog.length;
    return {
      name: heading[1] ?? '',
      date: heading[2] ?? '',
      body: changelog.slice(start, end).trim(),
    };
  });
}

export function unreleasedNotes(changelog: string): string {
  return sections(changelog).find((section) => section.name === 'Unreleased')?.body ?? '';
}

export function releasedSections(changelog: string): ReleaseSection[] {
  return sections(changelog)
    .filter((section) => section.name !== 'Unreleased')
    .map(({ name, date, body }) => ({ version: name, date, body }));
}

/**
 * Turns the Unreleased notes into a dated section for `version`, leaving an empty
 * Unreleased section above it.
 */
export function applyRelease(changelog: string, version: string, date: string): string {
  const notes = unreleasedNotes(changelog);
  if (!notes) throw new Error('The Unreleased section is empty: there is nothing to release');
  if (releasedSections(changelog).some((section) => section.version === version)) {
    throw new Error(`CHANGELOG.md already has a section for ${version}`);
  }
  const heading = '## [Unreleased]';
  const start = changelog.indexOf(heading) + heading.length;
  const end = start + changelog.slice(start).indexOf(notes) + notes.length;
  const body = notes.replace(LIVE_MARK, '');
  return `${changelog.slice(0, start)}\n\n## [${version}] - ${date}\n\n${body}${changelog.slice(end)}`;
}

/** The note on an Unreleased line already published without a version (CLAUDE.md, section 8). */
const LIVE_MARK = / _\(Live since \d{4}-\d{2}-\d{2}, published without a version[^)]*\)_/g;

/**
 * A release the Deploy workflow may create: the tag, the commit and the date become
 * arguments of `gh release create` and fields of a tab-separated plan, so each is checked
 * to be exactly what it claims before it gets there.
 */
export function checkRelease(release: { version: string; commit: string; date: string }) {
  if (!VERSION_PATTERN.test(release.version))
    throw new Error(`Not a MAJOR.MINOR.PATCH version: ${release.version}`);
  if (!/^[0-9a-f]{40}$/.test(release.commit))
    throw new Error(`Not a full commit hash: ${release.commit}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(release.date))
    throw new Error(`Not a YYYY-MM-DD date: ${release.date}`);
}
