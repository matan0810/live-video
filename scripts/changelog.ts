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
  return `${changelog.slice(0, start)}\n\n## [${version}] - ${date}\n\n${notes}${changelog.slice(end)}`;
}
