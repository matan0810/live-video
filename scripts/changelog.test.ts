import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyRelease,
  checkRelease,
  nextVersion,
  releasedSections,
  unreleasedNotes,
} from './changelog';

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

  it('drops the mark of lines already live without a version', () => {
    const marked = sample.replace(
      '- Something new.',
      "- Something new. _(Live since 2024-01-30, published without a version at the owner's request.)_",
    );
    expect(releasedSections(applyRelease(marked, '1.2.0', '2024-02-03'))[0]?.body).toBe(
      '### Added\n- Something new.',
    );
  });

  it('refuses an empty release and a duplicate version', () => {
    const released = applyRelease(sample, '1.2.0', '2024-02-03');
    expect(() => applyRelease(released, '1.3.0', '2024-02-04')).toThrow(/empty/);
    expect(() => applyRelease(sample, '1.1.0', '2024-02-04')).toThrow(/already/);
  });
});

describe('checkRelease', () => {
  const ok = { version: '3.1.0', commit: 'a'.repeat(40), date: '2026-11-20' };

  it('accepts a well-formed release', () => {
    expect(() => checkRelease(ok)).not.toThrow();
  });

  it.each([
    ['a version with a tab', { ...ok, version: '3.1.0\tx' }],
    ['a version with a shell word', { ...ok, version: '3.1.0; rm -rf /' }],
    ['a short commit', { ...ok, commit: 'abc1234' }],
    ['a branch name as commit', { ...ok, commit: 'master' }],
    ['a date with a newline', { ...ok, date: '2026-11-20\nv9' }],
  ])('refuses %s', (_, release) => {
    expect(() => checkRelease(release)).toThrow();
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

  it('list only well-formed past releases', () => {
    const dates = new Map(releasedSections(changelog).map((s) => [s.version, s.date]));
    for (const { version, commit } of history)
      expect(() => checkRelease({ version, commit, date: dates.get(version) ?? '' })).not.toThrow();
  });
});
