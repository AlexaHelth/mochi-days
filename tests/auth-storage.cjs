const fs=require('node:fs');const assert=require('node:assert/strict');const {DatabaseSync}=require('node:sqlite');const ts=require('typescript');
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_clammy_sally_floyd.sql','utf8'));
function statement(sql,args=[]){return{bind(...values){return statement(sql,values)},async first(){return sqlite.prepare(sql).get(...args)??null},async run(){return sqlite.prepare(sql).run(...args)},all(){return sqlite.prepare(sql).all(...args)}}}
const db={prepare:statement,async batch(list){sqlite.exec('BEGIN');try{const r=list.map(s=>({results:s.all(),success:true}));sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
let user=null;
function load(path,mocks){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const shared=load('packages/mochi-assets/index.js',{});const helpers=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':shared});const api=load('app/api/state/route.ts',{'../../chatgpt-auth':{getChatGPTUser:async()=>user},'@/lib/store':{database:()=>db},'@/lib/mochi':helpers});
const body={kind:'entry',day:helpers.today(),weight:60,mood:0,done:['h0']};
function request(data,origin='https://example.test'){return new Request('https://example.test/api/state',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)})}
(async()=>{
assert.equal((await api.GET()).status,401);assert.equal((await api.POST(request(body))).status,401);
user={userId:'test-a',email:'a@example.test'};
assert.equal((await api.POST(request(body,'https://other.test'))).status,403);
assert.equal((await api.POST(request({...body,weight:-3}))).status,400);
assert.equal((await api.POST(request({...body,day:'2026-02-31'}))).status,400);
assert.equal((await api.POST(request({...body,day:'2999-01-01'}))).status,400);
assert.equal((await api.POST(request({...body,userId:'test-b'}))).status,400);
let r=await api.POST(request(body));assert.equal(r.status,200);let data=await r.json();assert.equal(data.stars,3);assert.equal(data.entries[0].weight,60);
await api.POST(request(body));data=await(await api.GET()).json();assert.equal(data.stars,3);
await api.POST(request({...body,done:[]}));data=await(await api.GET()).json();assert.equal(data.stars,3);
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,room:'flower'}))).status,403);
user={userId:'test-b',email:'b@example.test'};data=await(await api.GET()).json();assert.equal(data.entries.length,0);assert.equal(data.stars,0);
await api.POST(request({...body,weight:70}));data=await(await api.GET()).json();assert.equal(data.entries[0].weight,70);
user={userId:'test-a',email:'a@example.test'};data=await(await api.GET()).json();assert.equal(data.entries[0].weight,60);
const saved=await api.POST(request({kind:'settings',...helpers.defaults,name:'しろ',showWeight:false}));assert.equal(saved.status,200);data=await(await api.GET()).json();assert.equal(data.settings.name,'しろ');assert.equal(data.settings.showWeight,false);
assert.match(saved.headers.get('cache-control'),/no-store/);
// New accounts choose once; pre-existing accounts keep their puppy and records.
user={userId:'new-pet',email:'new@example.test'};
data=await(await api.GET()).json();assert.equal(data.settings.onboardingComplete,false);assert.equal(data.settings.species,'dog');
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,species:'dragon'}))).status,400);
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,outfit:'unknown'}))).status,400);
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,species:'cat',outfit:'bandana'}))).status,403);
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,name:'  しらたま  ',species:'cat',onboardingComplete:true}))).status,200);
data=await(await api.GET()).json();assert.equal(data.settings.species,'cat');assert.equal(data.settings.name,'しらたま');assert.equal(data.settings.onboardingComplete,true);
await api.POST(request({...body,done:['h0','h1','h2']}));
assert.equal((await api.POST(request({kind:'settings',...data.settings,outfit:'bandana'}))).status,200);
data=await(await api.GET()).json();assert.equal(data.settings.outfit,'bandana');assert.equal(data.stars,5);
assert.equal((await api.POST(request({kind:'settings',...data.settings,outfit:'ribbon'}))).status,403);
await api.POST(request({kind:'settings',...data.settings,species:'penguin',onboardingComplete:false}));
data=await(await api.GET()).json();assert.equal(data.settings.species,'penguin');assert.equal(data.settings.outfit,'bandana');assert.equal(data.settings.onboardingComplete,true);assert.equal(data.entries.length,1);assert.equal(data.stars,5);
// An older open client must not erase the new pet choice or outfit.
const oldSettings={name:'もち',habits:['歩く'],showWeight:true,room:'cream'};
await api.POST(request({kind:'settings',...oldSettings}));data=await(await api.GET()).json();assert.equal(data.settings.species,'penguin');assert.equal(data.settings.outfit,'bandana');
user={userId:'legacy-pet',email:'legacy@example.test'};
sqlite.prepare('INSERT INTO profiles(user_id,settings) VALUES(?,?)').run(user.userId,JSON.stringify(oldSettings));
data=await(await api.GET()).json();assert.equal(data.settings.onboardingComplete,true);assert.equal(data.settings.species,'dog');assert.equal(data.settings.outfit,'none');assert.equal(data.settings.habits[0],'歩く');
user={userId:'legacy-records',email:'legacy-records@example.test'};await api.POST(request(body));
data=await(await api.GET()).json();assert.equal(data.settings.onboardingComplete,true);assert.equal(data.settings.species,'dog');
user={userId:'another-pet',email:'another@example.test'};
data=await(await api.GET()).json();assert.equal(data.settings.onboardingComplete,false);assert.equal(data.settings.outfit,'none');assert.equal(data.stars,0);
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,outfit:'bandana'}))).status,403);
// Every species, expression and outfit maps to a valid cell without crossing rows.
for(const species of helpers.speciesIds)for(const outfit of helpers.outfitIds)for(let pose=0;pose<8;pose++){
 const sprite=helpers.petSprite(species,pose,outfit);assert.ok(sprite.cell>=0&&sprite.cell<sprite.columns*sprite.rows);assert.ok(sprite.src.startsWith('/'));
}
assert.deepEqual(helpers.petSprite('dog',0),{src:'/pets/puppy.png',columns:2,rows:2,cell:0});
console.log('PASS: first-use onboarding, legacy profile/record migration, species and outfit persistence, server-side unlock boundary, invalid pet/outfit rejection, old-client compatibility, progress preservation, per-user wardrobe isolation, sprite cells.');
console.log('PASS: unauthenticated denial, cross-origin denial, input validation, invalid/future dates, ownership isolation, persistent updates, reward deduplication, non-decreasing stars, locked rewards, settings, private caching.');sqlite.close();
})().catch(e=>{console.error(e);process.exitCode=1});
