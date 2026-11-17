/**
 * Prepares a release: bumps the version in package.json and package-lock.json and turns
 * the Unreleased notes in CHANGELOG.md into a section dated today.
 *
 *   npm run bump -- patch|minor|major
 */
import { readFile, writeFile } from 'node:fs/promises';
import { applyRelease, nextVersion, type Bump } from './changelog.ts';

const BUMPS: readonly Bump[] = ['patch', 'minor', 'major'];
const root = new URL('../', import.meta.url);
const bump = process.argv[2];
if (!BUMPS.some((option) => option === bump)) {
  throw new Error(`Usage: npm run bump -- ${BUMPS.join('|')}`);
}

const readJson = async (file: string) => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const writeJson = (file: string, data: unknown) =>
  writeFile(new URL(file, root), `${JSON.stringify(data, null, 2)}\n`);

const pkg = await readJson('package.json');
const version = nextVersion(pkg.version, bump as Bump);
const today = new Date().toISOString().slice(0, 10);

const changelogUrl = new URL('CHANGELOG.md', root);
const changelog = applyRelease(await readFile(changelogUrl, 'utf8'), version, today);

const lock = await readJson('package-lock.json');
lock.version = version;
lock.packages[''].version = version;
pkg.version = version;

await writeFile(changelogUrl, changelog);
await writeJson('package.json', pkg);
await writeJson('package-lock.json', lock);
console.log(`Version ${version}, dated ${today}. Commit it as "Release v${version}".`);
