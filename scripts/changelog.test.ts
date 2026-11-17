import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyRelease, nextVersion, releasedSections, unreleasedNotes } from './changelog';

const sample = `# Changelog

Intro.

## [Unreleased]

### Added
- Something new.

## [1.1.0] - 2024-01-02

### Fixed
- A bug.

## [1.0.0] - 2023-11-22

- First.
`;

describe('nextVersion', () => {
  it.each([
    ['1.2.3', 'patch', '1.2.4'],
    ['1.2.3', 'minor', '1.3.0'],
    ['1.2.3', 'major', '2.0.0'],
  ] as const)('%s + %s = %s', (current, bump, expected) => {
    expect(nextVersion(current, bump)).toBe(expected);
  });

  it('rejects anything but MAJOR.MINOR.PATCH', () => {
    expect(() => nextVersion('1.2', 'patch')).toThrow();
  });
});

describe('sections', () => {
  it('reads the Unreleased notes', () => {
    expect(unreleasedNotes(sample)).toBe('### Added\n- Something new.');
  });

  it('reads released versions with their dates and notes', () => {
    expect(releasedSections(sample)).toEqual([
      { version: '1.1.0', date: '2024-01-02', body: '### Fixed\n- A bug.' },
      { version: '1.0.0', date: '2023-11-22', body: '- First.' },
    ]);
  });
});

describe('applyRelease', () => {
  it('moves the Unreleased notes into a dated section', () => {
    const released = applyRelease(sample, '1.2.0', '2024-02-03');
    expect(unreleasedNotes(released)).toBe('');
    expect(releasedSections(released)[0]).toEqual({
      version: '1.2.0',
      date: '2024-02-03',
      body: '### Added\n- Something new.',
    });
    expect(releasedSections(released)).toHaveLength(3);
  });

  it('refuses an empty release and a duplicate version', () => {
    const released = applyRelease(sample, '1.2.0', '2024-02-03');
    expect(() => applyRelease(released, '1.3.0', '2024-02-04')).toThrow(/empty/);
    expect(() => applyRelease(sample, '1.1.0', '2024-02-04')).toThrow(/already/);
  });
});

describe('the project files', () => {
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const history: { version: string; commit: string }[] = JSON.parse(
    readFileSync(new URL('./release-history.json', import.meta.url), 'utf8'),
  );

  it('keep package.json and package-lock.json on the same version', () => {
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[''].version).toBe(pkg.version);
  });

  it('have a CHANGELOG section for the current version and every past release', () => {
    const documented = releasedSections(changelog).map((section) => section.version);
    expect(documented).toContain(pkg.version);
    for (const { version } of history) expect(documented).toContain(version);
  });

  it('list past releases oldest first, with full commit ids, below the current version', () => {
    const versions = history.map((entry) => entry.version);
    const sorted = [...versions].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    expect(versions).toEqual(sorted);
    expect(versions).not.toContain(pkg.version);
    for (const { commit } of history) expect(commit).toMatch(/^[0-9a-f]{40}$/);
  });
});
