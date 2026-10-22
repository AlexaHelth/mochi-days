const assert = require('node:assert/strict');
const { realpathSync } = require('node:fs');
const http = require('node:http');
const { createRequire } = require('node:module');
const { spawn } = require('node:child_process');
const test = require('node:test');

// Exercises Miniflare's actual external dependency, not Node's bundled fetch.
// Synthetic loopback traffic only. The malformed response runs in a child so
// a regression cannot crash the test runner. No production URLs or records.
test('Undici rejects excessive content encodings without crashing; normal fetch still works', { timeout: 10000 }, async t => {
  const wranglerRequire = createRequire(realpathSync(require.resolve('wrangler/package.json')));
  const miniflareRequire = createRequire(wranglerRequire.resolve('miniflare'));
  const undici = miniflareRequire.resolve('undici');
  assert.equal(miniflareRequire('undici/package.json').version, '7.30.1');
  const server = http.createServer((request, response) => {
    if (request.url === '/normal') return response.end('synthetic-ok');
    response.writeHead(200, {
      'content-encoding': 'gzip, gzip, gzip, gzip, gzip, gzip',
      'content-length': '1',
    });
    response.flushHeaders();
    setTimeout(() => response.socket?.destroy(), 15);
  });
  t.after(() => { server.closeAllConnections(); server.close(); });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const script = `
    const assert = require('node:assert/strict');
    const { fetch } = require(${JSON.stringify(undici)});
    (async () => {
      assert.equal(await (await fetch(${JSON.stringify(base + '/normal')})).text(), 'synthetic-ok');
      await assert.rejects(fetch(${JSON.stringify(base + '/malformed')}));
      // Wait for an orphaned stream error, the original crash mechanism.
      setTimeout(() => process.exit(0), 250);
    })().catch(() => process.exit(2));
  `;
  const child = spawn(process.execPath, ['--eval', script], { stdio: 'ignore' });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  const outcome = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  assert.deepEqual(outcome, { code: 0, signal: null });
});
