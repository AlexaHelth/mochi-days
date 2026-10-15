// No HTTP server, real identities or persisted database. Test production handlers in memory.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const { createRequire } = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sqlite = new DatabaseSync(':memory:');
let step = 'setup', groups = 0, incoming = new Headers(), databaseCalls = 0;
const finish = () => { groups++; };
function load(file, mocks = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  const exports = {}, localRequire = createRequire(require('node:path').resolve(file));
  new Function('require', 'exports', output.outputText)(id => Object.hasOwn(mocks,id) ? mocks[id] : localRequire(id), exports);
  return exports;
}
for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function statement(sql, args = []) {
  return { bind(...values) { return statement(sql, values); }, async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async run() { return sqlite.prepare(sql).run(...args); }, all() { return sqlite.prepare(sql).all(...args); } };
}
const db = { prepare: statement, async batch(items) {
  sqlite.exec('BEGIN');
  try { const results=items.map(s=>({results:s.all(),success:true}));sqlite.exec('COMMIT');return results; }
  catch(e) { sqlite.exec('ROLLBACK');throw e; }
} };
const auth = load('app/chatgpt-auth.ts', { 'next/headers': { headers: async()=>incoming }, 'next/navigation': { redirect:()=>{throw new Error('redirect');} } });
const assets = load('packages/mochi-assets/index.js');
const mochi = load('lib/mochi.ts', {'../packages/mochi-assets/index.js':assets});
const content = load('lib/companion-content.ts');
const companion = load('lib/companion.ts', {'./mochi':mochi,'./companion-content':content});
const habits = load('lib/habits.ts');
const rules = load('lib/state-rules.ts', {'./mochi':mochi,'./companion':companion,'./companion-content':content});
const api = load('app/api/state/route.ts', {'../../chatgpt-auth':auth,'@/lib/store':{database:()=>{databaseCalls++;return db;}},'@/lib/mochi':mochi,'@/lib/companion':companion,'@/lib/habits':habits,'@/lib/state-rules':rules});
const exporter = load('app/api/export/route.ts', {'../state/route':api,'@/lib/mochi':mochi});
const origin = 'https://security.example.test';
const body = {kind:'entry',day:mochi.today(),weight:60,mood:1,done:[],note:'synthetic'};
function identity(id) { incoming = new Headers({'oai-authenticated-user-id':id,'oai-authenticated-user-email':'synthetic@example.test'}); }
function request(value, options = {}) {
  return new Request(origin+'/api/state', { method:'POST', headers:{Origin:origin,'Content-Type':'application/json',...options.headers},
    body:options.raw ?? JSON.stringify(value) });
}
async function data() { const r=await api.GET();assert.equal(r.status,200);return r.json(); }
(async()=>{
  step='unauthenticated access';
  assert.equal((await api.GET()).status,401);assert.equal((await exporter.GET()).status,401);assert.equal((await api.POST(request(body))).status,401);
  assert.equal(databaseCalls,0);
  incoming=new Headers({'oai-authenticated-user-id':'only-one-header'});assert.equal(await auth.getChatGPTUser(),null);finish();

  step='trusted header assumption';
  identity('synthetic-a');assert.equal((await auth.getChatGPTUser()).userId,'synthetic-a');
  // This deliberately demonstrates the trust boundary, NOT a claim that production accepts spoofed headers.
  incoming.set('oai-authenticated-user-full-name','%ZZ');incoming.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');
  assert.equal((await auth.getChatGPTUser()).fullName,null);finish();

  step='CSRF, content type and payload rejection';
  for(const value of ['https://attacker.example.test','null','']) assert.equal((await api.POST(request(body,{headers:{Origin:value}}))).status,403);
  const missing = request(body);missing.headers.delete('origin');assert.equal((await api.POST(missing)).status,403);
  assert.equal((await api.POST(request(body,{headers:{'Content-Type':'text/plain'}}))).status,415);
  assert.equal((await api.POST(request(body,{raw:'{'}))).status,400);
  assert.equal((await api.POST(request(body,{raw:' '.repeat(5001)}))).status,413);
  for(const extra of [{userId:'synthetic-b'},{user_id:'synthetic-b'},{organizationId:'other'},{stars:9999}])assert.equal((await api.POST(request({...body,...extra}))).status,400);
  assert.equal(databaseCalls,0);finish();

  step='SQL parameterization and private export';
  const injection="'); DROP TABLE entries; --";
  assert.equal((await api.POST(request({...body,note:injection}))).status,200);
  identity('synthetic-b');assert.equal((await data()).entries.length,0);assert.equal((await (await exporter.GET()).json()).entries.length,0);
  assert.equal((await api.POST(request({...body,note:'other synthetic record'}))).status,200);
  identity("synthetic-a' OR 1=1 --");assert.equal((await data()).entries.length,0);
  assert.equal((await api.POST(request({...body,note:'third synthetic record'}))).status,200);
  identity('synthetic-a');assert.equal((await data()).entries[0].note,injection);
  const exported=await exporter.GET();assert.match(exported.headers.get('cache-control'),/private.*no-store/);
  assert.equal(exported.headers.get('x-content-type-options'),'nosniff');assert.match(exported.headers.get('content-disposition'),/attachment/);
  const backup=await exported.json();assert.equal(backup.entries.length,1);assert.equal(backup.entries[0].note,injection);assert.equal(backup.userId,undefined);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM entries').get().n,3);finish();

  step='return URL normalization';
  for(const value of ['https://attacker.example.test/','//attacker.example.test/','/\\attacker.example.test/','/signin-with-chatgpt','/signout-with-chatgpt','/callback'])
    assert.equal(new URL(auth.chatGPTSignInPath(value),origin).searchParams.get('return_to'),'/');
  assert.equal(new URL(auth.chatGPTSignInPath('/install?x=1#help'),origin).searchParams.get('return_to'),'/install?x=1#help');finish();

  step='development-only identity middleware';
  const plugin=load('build/sites-vite-plugin.ts');let middleware;
  plugin.sites().configureServer({middlewares:{use:fn=>middleware=fn},config:{server:{},logger:{info(){}}}});
  const req={url:'/api/state',method:'GET',headers:{host:'attacker.example.test','oai-authenticated-user-id':'forged','oai-authenticated-user-email':'forged@example.test'},rawHeaders:['oai-authenticated-user-id','forged','oai-authenticated-user-email','forged@example.test'],socket:{remoteAddress:'203.0.113.10'}};
  let next=false;middleware(req,{setHeader(){},end(){}},()=>{next=true;});assert(next);
  assert.equal(req.headers['oai-authenticated-user-id'],undefined);assert.equal(req.headers['oai-authenticated-user-email'],undefined);assert.equal(req.rawHeaders.length,0);
  let disabledUsed=false;plugin.sites({mockAuth:false}).configureServer({middlewares:{use:()=>disabledUsed=true}});assert.equal(disabledUsed,false);finish();

  step='actual note and goal text escaping';
  // Render actual TodayView, including a malicious synthetic note, name and goal.
  const marker='<img src=x onerror=alert(1)>';
  const todayView=load('app/today-view.tsx',{
    '@/components/ui/checkbox':{Checkbox:()=>React.createElement('input',{type:'checkbox'})},
    '@/lib/habits':habits,'@/lib/history':load('lib/history.ts',{'./mochi':mochi}),
    '@/lib/weight':load('lib/weight.ts',{'./mochi':mochi}),
  });
  const props={entry:{...body,note:marker},entries:[],settings:{...mochi.defaults,name:marker,goal:marker},habitNames:['one','two','three'],care:{},disabled:false,saving:false,saved:false,recordsOpen:true,pet:React.createElement('span',null,marker)};
  const markup=renderToStaticMarkup(React.createElement(todayView.TodayView,props));
  assert(!markup.includes(marker));assert(markup.includes('&lt;img'));finish();
  console.log(JSON.stringify({status:'pass',groups,scope:'synthetic in-memory handler, auth, dev middleware and React rendering tests; production edge and browser storage isolation not verified'}));
})().catch(()=>{console.log(JSON.stringify({status:'error',step,detail:'Assertion or setup failed; values and stack suppressed'}));process.exitCode=1;}).finally(()=>sqlite.close());
