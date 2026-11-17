/**
 * Lists every release that should exist on GitHub: the past releases in
 * release-history.json and the current version at the given commit. Writes each
 * release's notes to a file and prints one tab-separated line per release, oldest first:
 *
 *   tag  commit  title  notes-file  is-latest
 *
 *   node scripts/release-plan.ts <current commit> <notes directory>
 *
 * The Deploy workflow creates whichever of these releases do not exist yet.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { releasedSections } from './changelog.ts';

const [currentCommit, notesDir] = process.argv.slice(2);
if (!currentCommit || !notesDir) {
  throw new Error('Usage: node scripts/release-plan.ts <current commit> <notes directory>');
}

const root = new URL('../', import.meta.url);
const read = (file: string) => readFile(new URL(file, root), 'utf8');

const { version: currentVersion } = JSON.parse(await read('package.json'));
const history: { version: string; commit: string }[] = JSON.parse(
  await read('scripts/release-history.json'),
);
const sections = new Map(
  releasedSections(await read('CHANGELOG.md')).map((section) => [section.version, section]),
);

const releases = [...history, { version: currentVersion as string, commit: currentCommit }];
await mkdir(notesDir, { recursive: true });

for (const { version, commit } of releases) {
  const section = sections.get(version);
  if (!section) throw new Error(`CHANGELOG.md has no section for ${version}`);
  const notesFile = join(notesDir, `v${version}.md`);
  await writeFile(notesFile, `${section.body}\n`);
  const isLatest = version === currentVersion;
  console.log(
    [`v${version}`, commit, `v${version} (${section.date})`, notesFile, isLatest].join('\t'),
  );
}
