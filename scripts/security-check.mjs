/** Read-only, repository-local checks. No build, install, server, DB or production requests. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const statuses = new Set(['pass', 'review', 'unknown', 'error', 'not_applicable']);
export function result(id, status, detail, evidence = {}) {
  if (!statuses.has(status)) throw new Error('Invalid status');
  return { id, status, detail, ...evidence };
}
export function exitCode(checks) {
  if (checks.some(c => c.status === 'unknown' || c.status === 'error')) return 2;
  return checks.some(c => c.status === 'review') ? 1 : 0;
}
export function runCommand(command, args, options = {}) {
  // Never forward child stdout/stderr to the terminal: failures may contain records or credentials.
  const r = spawnSync(command, args, { cwd: project, encoding: 'utf8', shell: false,
    timeout: 45000, maxBuffer: 16 * 1024 * 1024, ...options });
  return { code: r.status, failure: r.error ? (r.error.code === 'ETIMEDOUT' ? 'timeout' : 'execution_failed') : r.signal ? 'terminated' : null,
    stdout: r.stdout ?? '' };
}
function git(args) {
  const r = runCommand('git', args);
  if (r.failure || r.code !== 0) throw new Error('Git unavailable');
  return r.stdout.trim();
}
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const safeName = value => typeof value === 'string' && /^[\w@./<>+() =^~|*,-]{1,2000}$/.test(value);
const lineAt = (source, offset) => source.slice(0, offset).split('\n').length;

export function secretCandidates(name, source) {
  // Candidates only, never validated credentials. Do not include matched text, excerpts or hashes.
  const patterns = [
    ['private_key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
    ['github_token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
    ['aws_access_key_id', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
    ['literal_credential', /\b(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\b\s*[:=]\s*["'][^"'\r\n]{12,}["']/gi],
  ];
  return patterns.flatMap(([kind, pattern]) => [...source.matchAll(pattern)].map(m => ({ file: name, line: lineAt(source, m.index), kind })));
}

export function parseAudit(text, code) {
  const data = JSON.parse(text);
  if (![0, 1].includes(code) || !data || data.error || data.code || !data.advisories || Array.isArray(data.advisories) ||
      !data.metadata?.vulnerabilities || typeof data.metadata.totalDependencies !== 'number') throw new Error('Incomplete audit');
  const advisories = Object.values(data.advisories).map(a => {
    if (!safeName(a.module_name) || !['critical','high','moderate','low','info'].includes(a.severity) ||
        !/^https:\/\/github\.com\/advisories\/GHSA-[a-z0-9-]+$/.test(a.url) || !Array.isArray(a.findings) ||
        !a.findings.length || !safeName(a.vulnerable_versions) || (a.patched_versions != null && !safeName(a.patched_versions))) throw new Error('Invalid advisory');
    const instances = a.findings.map(f => {
      if (!safeName(f.version) || typeof f.dev !== 'boolean' || typeof f.optional !== 'boolean' || !Array.isArray(f.paths) || !f.paths.length || f.paths.some(p => !safeName(p))) throw new Error('Invalid package path');
      return { version: f.version, paths: f.paths, dev: f.dev === true, optional: f.optional === true };
    });
    return { package: a.module_name, severity: a.severity, advisory: a.url, affected: a.vulnerable_versions,
      patched: a.patched_versions ?? null, instances, applicability: 'manual_review_required' };
  });
  const counts = {};
  for (const severity of ['critical','high','moderate','low','info']) {
    const n = data.metadata.vulnerabilities[severity];
    if (!Number.isInteger(n) || n < 0) throw new Error('Invalid audit counts');
    counts[severity] = n;
  }
  if (Object.values(counts).reduce((a,b) => a+b,0) !== advisories.length || (code === 1) !== (advisories.length > 0)) throw new Error('Inconsistent audit');
  return { counts, advisoryCount: advisories.length, uniqueAdvisoryCount: new Set(advisories.map(a => a.advisory)).size, advisories };
}

function dependencyInventory(pkg, lock, rootRequire) {
  // Reuse the installed ESLint YAML parser; do not install anything or guess at unsupported YAML.
  // createRequire returns a function; keep parser resolution local to ESLint's dependencies.
  const eslintRequire = createRequire(rootRequire.resolve('eslint'));
  const parsed = eslintRequire('js-yaml').load(lock, { schema: eslintRequire('js-yaml').JSON_SCHEMA });
  if (!['9.0', '9'].includes(String(parsed?.lockfileVersion)) || !parsed?.importers?.['.'] || !parsed?.packages) throw new Error('Unsupported lock');
  const direct = [];
  for (const group of ['dependencies','devDependencies','optionalDependencies']) for (const [name, specifier] of Object.entries(pkg[group] ?? {})) {
    const item = parsed.importers['.'][group]?.[name];
    if (!item || item.specifier !== specifier || !safeName(name) || !safeName(item.version)) throw new Error('Lock mismatch');
    const manifest = path.join(project, 'node_modules', ...name.split('/'), 'package.json');
    const installed = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')).version : null;
    if (installed !== null && (!safeName(installed) || installed !== item.version.split('(')[0])) throw new Error('Installed version mismatch');
    direct.push({ package: name, group, locked: item.version.split('(')[0], installed });
  }
  return { direct, lockedPackageRecords: Object.keys(parsed.packages).length, lockVersion: String(parsed.lockfileVersion) };
}

export function analyzeSources(ts, files) {
  const indicators = [], routes = [];
  for (const [name, source] of files) {
    if (!/\.[cm]?[jt]sx?$/.test(name)) continue;
    const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
    if (ast.parseDiagnostics.length) throw new Error('Source parse failed');
    const add = (kind, node) => indicators.push({ file: name, line: lineAt(source, node.getStart(ast)), kind });
    function visit(node) {
      if (ts.isJsxAttribute(node) && node.name.getText(ast) === 'dangerouslySetInnerHTML') add('raw_html_sink_review_input_flow', node);
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(ast);
        if (/^(?:fetch|eval)$/.test(callee) || /(?:\.|^)(?:execSync|spawn|fetch)$/.test(callee)) add('call_' + callee.split('.').at(-1), node);
        if (callee.endsWith('.prepare') && node.arguments[0] && !ts.isStringLiteral(node.arguments[0]) && !ts.isNoSubstitutionTemplateLiteral(node.arguments[0])) add('dynamic_sql_review_required', node);
      }
      if (/^app\/api\/.*\/route\.ts$/.test(name) && ts.isFunctionDeclaration(node) && node.name &&
          node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) routes.push({ file: name, method: node.name.text });
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  return { indicators, routes };
}

export function runAudit({ online = false } = {}) {
  const checks = [], timestamp = new Date().toISOString();
  let scope = {}, files = new Map(), initialFingerprint;
  const rootRequire = createRequire(path.join(project, 'package.json'));
  function snapshot() {
    const names = git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean).sort();
    const digests = [], texts = new Map(), excluded = [];
    for (const name of names) {
      const filename = path.join(project, name), stat = fs.lstatSync(filename);
      if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 4 * 1024 * 1024) { excluded.push(name); continue; }
      const data = fs.readFileSync(filename);
      digests.push([name, hash(data)]);
      if (!data.includes(0)) texts.set(name, data.toString('utf8'));
    }
    return { names, texts, excluded, fingerprint: hash(JSON.stringify(digests)) };
  }
  try {
    const snap = snapshot(); files = snap.texts; initialFingerprint = snap.fingerprint;
    scope = { branch: git(['branch','--show-current']), commit: git(['rev-parse','HEAD']),
      worktreeFingerprint: snap.fingerprint, trackedAndUntrackedFiles: snap.names.length, textFiles: files.size,
      modifiedPaths: git(['diff','--name-only']).split('\n').filter(Boolean),
      untrackedPaths: git(['ls-files','--others','--exclude-standard']).split('\n').filter(Boolean) };
    checks.push(result('scope', 'pass', 'Current working tree, including tracked changes and non-ignored untracked files; no fetch or production access.'));
    if (snap.excluded.length) checks.push(result('file_scan_exclusions', 'unknown', 'Symlinks, special files or files over 4 MiB were not scanned.', { files: snap.excluded }));
    checks.push(result('policy_documents', 'review', 'Absence is a governance observation, not proof of a vulnerability.',
      { agents: snap.names.filter(p => /(^|\/)AGENTS\.md$/.test(p)), security: snap.names.filter(p => /(^|\/)SECURITY\.md$/.test(p)), readme: files.has('README.md') }));
  } catch { checks.push(result('scope', 'error', 'Could not safely inventory the repository.')); }
  checks.push(result('ipa_article', 'unknown', 'The requested IPA article has not been verified by this script; it makes no web request. See the dated report for the fetch failure.'));
  try {
    if (!initialFingerprint) throw new Error('Inventory unavailable');
    const candidates = [...files].flatMap(([name, text]) => secretCandidates(name, text));
    checks.push(result('secret_patterns', candidates.length ? 'review' : 'pass', 'Limited working-tree pattern scan; not credential validation, entropy scanning or Git-history scanning.', { candidates, scannedTextFiles: files.size }));
  } catch { checks.push(result('secret_patterns', 'error', 'Secret-pattern analysis failed; no matched values emitted.')); }
  try {
    if (!initialFingerprint) throw new Error('Inventory unavailable');
    const ts = rootRequire('typescript'), analysis = analyzeSources(ts, [...files].filter(([name]) => /^(app|lib|components|build|github-pages)\//.test(name)));
    checks.push(result('source_inventory', 'review', 'AST indicators require input-to-sink review; they are not confirmed vulnerabilities.', analysis));
  } catch { checks.push(result('source_inventory', 'error', 'TypeScript parser missing or source analysis failed.')); }
  try {
    const pkg = JSON.parse(files.get('package.json'));
    const inventory = dependencyInventory(pkg, files.get('pnpm-lock.yaml'), rootRequire);
    const missing = inventory.direct.some(d => d.installed === null);
    checks.push(result('lock_and_install', missing ? 'unknown' : 'pass', missing ? 'Lock parsed, but some installed direct versions could not be checked.' : 'Manifest specifiers, pnpm v9 lock data and installed direct versions agree.', inventory));
  } catch { checks.push(result('lock_and_install', 'error', 'Manifest/lock parsing, version consistency or installed parser check failed.')); }
  if (online) {
    const command = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';
    const r = runCommand(command, ['pnpm','audit','--json'], { timeout: 60000,
      env: { ...process.env, npm_config_registry: 'https://registry.npmjs.org', npm_config_fetch_retries: '0', npm_config_fetch_timeout: '20000' } });
    try {
      if (r.failure) throw new Error('Command failed');
      const audit = parseAudit(r.stdout, r.code);
      checks.push(result('dependency_advisories', audit.advisoryCount ? 'review' : 'pass',
        'npm registry advisory results for the lockfile, not proof of application exploitability or production patch status.', audit));
    } catch { checks.push(result('dependency_advisories', 'error', 'Audit unavailable, timed out, returned an error or incomplete JSON. Child output suppressed.', { commandExit: r.code, failure: r.failure })); }
  } else checks.push(result('dependency_advisories', 'unknown', 'Not executed. --online explicitly permits registry.npmjs.org audit traffic; no installs or updates.'));
  for (const [id, script] of [['existing_auth_storage','tests/auth-storage.cjs'],['existing_device_storage','tests/device-store.cjs'],['device_privacy','tests/device-privacy.cjs'],['security_boundaries','tests/security-boundaries.cjs']]) {
    if (!files.has(script)) { checks.push(result(id,'error','Required local test missing.')); continue; }
    const r = runCommand(process.execPath, [script]);
    checks.push(result(id, !r.failure && r.code === 0 ? 'pass' : 'error',
      'Real source loaded with in-memory SQLite/storage and synthetic identities. Child output suppressed; no server or production requests.', { file: script, commandExit: r.code, failure: r.failure }));
  }
  const tsc = path.join(project, 'node_modules/typescript/bin/tsc');
  if (fs.existsSync(tsc)) {
    const r = runCommand(process.execPath, [tsc,'--noEmit','--incremental','false']);
    checks.push(result('typecheck', !r.failure && r.code === 0 ? 'pass' : 'error', 'TypeScript noEmit, without incremental cache; diagnostics suppressed.', { commandExit: r.code, failure: r.failure }));
  } else checks.push(result('typecheck','error','Installed TypeScript executable unavailable.'));
  checks.push(result('production_configuration', 'unknown', 'No production traffic or account/cloud access. Verify Sites edge header stripping, origin bypass prevention, access list, MFA, session cookies, account lifecycle, D1/R2, encryption and deployed commit manually.'));
  checks.push(result('production_logs', 'unknown', 'No production logs provided. Review the latest month, then three months; see runbook for event fields and comparison method.'));
  checks.push(result('history_and_extended_scanners', 'unknown', 'Git history and dedicated gitleaks/SAST/container scans not executed; the limited working-tree checks do not substitute for these.'));
  checks.push(result('password_reset_implementation', 'not_applicable', 'No app-owned password/reset/account-management implementation; external ChatGPT identity settings remain unverified.'));
  try {
    checks.push(result('read_only_invariant', snapshot().fingerprint === initialFingerprint ? 'pass' : 'error', 'Compared hashes of the inventoried files before and after checks. Ignored runtime data and metadata are not inspected.'));
  } catch { checks.push(result('read_only_invariant','error','Could not verify the before/after source fingerprint.')); }
  return { schemaVersion: 1, timestamp, online, scope, checks, exitCode: exitCode(checks),
    meaning: '0=all performed/applicable checks completed without review items; 1=review items; 2=incomplete or failed. Pass applies only to the named check, never overall security.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--online') || args.length > 1) {
    process.stdout.write(JSON.stringify({ error: 'usage: node scripts/security-check.mjs [--online]', exitCode: 2 }) + '\n');
    process.exitCode = 2;
  } else {
    try { const report = runAudit({ online: args.includes('--online') }); process.stdout.write(JSON.stringify(report, null, 2) + '\n'); process.exitCode = report.exitCode; }
    catch { process.stdout.write(JSON.stringify({ error: 'audit_failed_output_suppressed', exitCode: 2 }) + '\n'); process.exitCode = 2; }
  }
}
