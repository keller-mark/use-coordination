import { readFileSync } from 'node:fs';

interface PackageJson {
  version: string;
}

function readVersion(): string {
  try {
    // Relative to this module, both in src/ and in dist-tsc/.
    const packageJsonUrl = new URL('../package.json', import.meta.url);
    const packageJson = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as PackageJson;
    return packageJson.version;
  } catch (e) {
    return 'unknown';
  }
}

export const VERSION = readVersion();
