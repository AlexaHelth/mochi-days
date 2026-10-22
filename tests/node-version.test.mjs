import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { requiredNodeVersion, supportsNodeVersion } from '../scripts/check-node-version.mjs';

test('rejects the affected versions and unverified/EOL/prerelease release lines', () => {
  for (const version of ['22.13.0', '22.23.3', '24.19.0', '24.22.0', '26.12.0',
    '20.99.0', '23.99.0', '25.99.0', '27.0.0', '28.0.0', '24.22.1-rc.1', '24.22', '024.22.1', 'invalid']) {
    assert.equal(supportsNodeVersion(version), false, version);
  }
});

test('accepts each official patched floor and later stable patches on the same lines', () => {
  for (const version of ['22.23.4', 'v22.23.4', '22.23.5', '22.24.0',
    '24.22.1', 'v24.22.1', '24.22.2', '24.23.0', '26.12.1', '26.12.2', '26.13.0']) {
    assert.equal(supportsNodeVersion(version), true, version);
  }
  assert.equal(requiredNodeVersion, '^22.23.4 || ^24.22.1 || ^26.12.1');
});

test('CI, installer and all server/build commands enforce the declared baseline', () => {
  const require = createRequire(import.meta.url);
  const yaml = require(require.resolve('js-yaml', { paths: [require.resolve('eslint')] }));
  const root = new URL('../', import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const workspace = yaml.load(readFileSync(new URL('pnpm-workspace.yaml', root), 'utf8'));
  const workflow = yaml.load(readFileSync(new URL('.github/workflows/pages.yml', root), 'utf8'));
  const pinned = readFileSync(new URL('.node-version', root), 'utf8').trim();
  assert.equal(supportsNodeVersion(pinned), true);
  assert.equal(workspace.engineStrict, true);
  assert.equal(workspace.minimumReleaseAge, 10080);
  assert.deepEqual(workspace.minimumReleaseAgeExclude, ['undici@7.30.1']);
  const steps = workflow.jobs.build.steps;
  assert.equal(steps.find(step => step.uses?.startsWith('actions/setup-node@')).with['node-version-file'], '.node-version');
  assert(steps.some(step => step.run === 'node scripts/check-node-version.mjs'));
  assert(steps.some(step => step.run?.includes('node --test tests/node-version.test.mjs')));
  for (const name of ['dev', 'dev:pages', 'build', 'build:pages', 'build:cloudflare', 'preview:pages', 'preview:cloudflare', 'start']) {
    assert(pkg.scripts[name].startsWith('node scripts/check-node-version.mjs && '), name);
  }
  assert.equal(workspace.overrides['undici@>=7.0.0 <8.0.0'], '7.30.1');
  assert.equal(pkg.overrides['undici@>=7.0.0 <8.0.0'], '7.30.1');
});
