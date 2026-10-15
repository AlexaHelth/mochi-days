import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { result, exitCode, runCommand, secretCandidates, parseAudit, analyzeSources } from '../scripts/security-check.mjs';
const require = createRequire(import.meta.url);
const ts = require('typescript');

function fixture() {
  return { advisories: { 1: { module_name:'example-package',severity:'high',url:'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
    vulnerable_versions:'<2.0.0',patched_versions:'>=2.0.0',findings:[{version:'1.0.0',paths:['.>example-package'],dev:true,optional:false}] } },
    metadata:{vulnerabilities:{critical:0,high:1,moderate:0,low:0,info:0},totalDependencies:1} };
}
test('unknown, analysis failure and review cannot be reported as clean',()=>{
  assert.equal(exitCode([result('x','pass','done'),result('y','not_applicable','external provider')]),0);
  assert.equal(exitCode([result('x','review','candidate')]),1);
  assert.equal(exitCode([result('x','review','candidate'),result('y','unknown','not run')]),2);
  assert.equal(exitCode([result('x','error','parse failure')]),2);
  assert.throws(()=>result('x','skipped','not run'));
});
test('audit parser retains versions, advisory ranges, no-fix and manual applicability',()=>{
  const f=fixture(),r=parseAudit(JSON.stringify(f),1);
  assert.equal(r.advisoryCount,1);assert.equal(r.advisories[0].instances[0].version,'1.0.0');
  assert.equal(r.advisories[0].applicability,'manual_review_required');
  f.advisories[1].patched_versions=null;assert.equal(parseAudit(JSON.stringify(f),1).advisories[0].patched,null);
});
test('audit malformed JSON, tool errors, partial responses and inconsistent counts fail closed',()=>{
  for(const text of ['not json','{}','{"error":{"code":"offline"}}','{"advisories":{}}'])assert.throws(()=>parseAudit(text,0));
  assert.throws(()=>parseAudit(JSON.stringify(fixture()),0));
  assert.throws(()=>parseAudit(JSON.stringify(fixture()),7));
  const f=fixture();f.metadata.vulnerabilities.high=0;assert.throws(()=>parseAudit(JSON.stringify(f),1));
  const empty={advisories:{},metadata:{vulnerabilities:{critical:0,high:0,moderate:0,low:0,info:0},totalDependencies:1}};
  assert.equal(parseAudit(JSON.stringify(empty),0).advisoryCount,0);
  assert.throws(()=>parseAudit(JSON.stringify(empty),1));
  const missing=fixture();delete missing.advisories[1].findings[0].dev;assert.throws(()=>parseAudit(JSON.stringify(missing),1));
});
test('audit errors cannot inject a token, arbitrary URL or raw message into output',()=>{
  const f=fixture();f.advisories[1].module_name='unsafe\n'+ 'secret-value';assert.throws(()=>parseAudit(JSON.stringify(f),1));
  const g=fixture();g.advisories[1].url='https://attacker.example.test/token';assert.throws(()=>parseAudit(JSON.stringify(g),1));
  const h=fixture();h.advisories[1].message='never forward child messages';
  assert(!JSON.stringify(parseAudit(JSON.stringify(h),1)).includes(h.advisories[1].message));
});
test('secret scan emits only type, file and line; never the matching value',()=>{
  const synthetic='gh'+'p_'+'A'.repeat(36), source='first line\nconst value="'+synthetic+'";';
  const found=secretCandidates('fixture.ts',source);assert.equal(found.length,1);assert.equal(found[0].line,2);
  assert.deepEqual(Object.keys(found[0]).sort(),['file','kind','line']);assert(!JSON.stringify(found).includes(synthetic));
  assert.equal(secretCandidates('fixture.ts','const password = process.env.PASSWORD;').length,0);
});
test('child process failures suppress stderr and preserve exit/timeout failures',()=>{
  const r=runCommand(process.execPath,['-e',"process.stderr.write('synthetic-sensitive-output');process.exit(9)"]);
  assert.equal(r.code,9);assert.equal(r.stdout,'');assert(!JSON.stringify(r).includes('synthetic-sensitive-output'));
  const timed=runCommand(process.execPath,['-e','setInterval(()=>{},1000)'],{timeout:100});
  assert.equal(timed.failure,'timeout');
});
test('AST inventories sinks and exported API methods without claiming a vulnerability',()=>{
  const r=analyzeSources(ts,[['app/api/example/route.ts',"export async function GET(){return fetch('/api/test')}"],
    ['app/example.tsx','export const view=<div dangerouslySetInnerHTML={{__html:value}}/>;'],
    ['lib/query.ts','db.prepare(query);db.prepare("SELECT 1");']]);
  assert.deepEqual(r.routes,[{file:'app/api/example/route.ts',method:'GET'}]);
  assert.equal(r.indicators.filter(x=>x.kind==='dynamic_sql_review_required').length,1);
  assert(r.indicators.some(x=>x.kind==='raw_html_sink_review_input_flow'));
  assert.throws(()=>analyzeSources(ts,[['app/broken.ts','export function broken(']]));
});
