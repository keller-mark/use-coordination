// Because we only want a single changelog for the entire monorepo,
// we will prepend the autogenerated changelog located at packages/main/CHANGELOG.md
// to the root CHANGELOG.md.
import fs from 'node:fs';
import { join } from 'node:path';
import { MAIN_PACKAGE_DIR } from './constants.mjs';

// Read the new changelog file,
// removing the first line since it will always
// contain the main package name.
const newChangelogLines = fs.readFileSync(join(MAIN_PACKAGE_DIR, 'CHANGELOG.md'), { encoding: 'utf-8' })
  .split('\n');
newChangelogLines.splice(0, 1);
const newChangelog = newChangelogLines.join('\n');
const fullChangelog = fs.readFileSync('CHANGELOG.md', { encoding: 'utf-8' });

fs.writeFileSync('CHANGELOG.md', newChangelog + '\n' + fullChangelog);

// Also, need to update the version in the root package.json
// to reflect the new version in the main package.json.
const mainPkgJson = JSON.parse(fs.readFileSync(join(MAIN_PACKAGE_DIR, 'package.json'), { encoding: 'utf-8' }));
const rootPkgJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
rootPkgJson.version = mainPkgJson.version;
fs.writeFileSync('package.json', JSON.stringify(rootPkgJson, null, 2));
