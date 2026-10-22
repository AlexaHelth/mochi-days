import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep the package engine range as the single policy used by installs and checks.
const { engines } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const requiredNodeVersion = engines.node;

export function supportsNodeVersion(version) {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) return false; // Prerelease and unverified future release lines fail closed.
  const [, major, minor, patch] = match.map(Number);
  return requiredNodeVersion.split(' || ').some(clause => {
    const floor = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(clause);
    if (!floor) throw new Error('Expected explicit supported Node.js release floors.');
    const [, floorMajor, floorMinor, floorPatch] = floor.map(Number);
    return major === floorMajor && (minor > floorMinor || (minor === floorMinor && patch >= floorPatch));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (supportsNodeVersion(process.version)) {
    console.log(`Node.js ${process.version}: supported by this repository's security baseline.`);
  } else {
    console.error(`Node.js ${process.version} is unsupported. Install ${requiredNodeVersion} (recommended: .node-version).`);
    process.exitCode = 1;
  }
}
