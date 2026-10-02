const fs=require('node:fs');const assert=require('node:assert/strict');const {DatabaseSync}=require('node:sqlite');const ts=require('typescript');
const sqlite=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function statement(sql,args=[]){return{bind(...values){return statement(sql,values)},async first(){return sqlite.prepare(sql).get(...args)??null},async run(){return sqlite.prepare(sql).run(...args)},all(){return sqlite.prepare(sql).all(...args)}}}
const db={prepare:statement,async batch(list){sqlite.exec('BEGIN');try{const r=list.map(s=>({results:s.all(),success:true}));sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
let user=null;
function load(path,mocks){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const shared=load('packages/mochi-assets/index.js',{});const helpers=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':shared});const content=load('lib/companion-content.ts',{}),companion=load('lib/companion.ts',{'./mochi':helpers,'./companion-content':content});const rules=load('lib/state-rules.ts',{'./mochi':helpers,'./companion':companion,'./companion-content':content});const api=load('app/api/state/route.ts',{'../../chatgpt-auth':{getChatGPTUser:async()=>user},'@/lib/store':{database:()=>db},'@/lib/mochi':helpers,'@/lib/state-rules':rules,'@/lib/companion':companion});
const exportApi=load('app/api/export/route.ts',{'../state/route':api,'@/lib/mochi':helpers});
const body={kind:'entry',day:helpers.today(),weight:60,mood:0,done:['h0']};
function request(data,origin='https://example.test'){return new Request('https://example.test/api/state',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)})}
(async()=>{
assert.equal((await exportApi.GET()).status,401);assert.equal((await api.GET()).status,401);assert.equal((await api.POST(request(body))).status,401);
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
const goal='休日に、もちと15分のおさんぽ';
for(const badGoal of [12,null,'あ'.repeat(81)])assert.equal((await api.POST(request({kind:'settings',...data.settings,goal:badGoal}))).status,400);
assert.equal((await api.POST(request({kind:'settings',...data.settings,goal:'  '+goal+'  '}))).status,200);
data=await(await api.GET()).json();assert.equal(data.settings.goal,goal);assert.equal(data.entries.length,1);assert.equal(data.stars,5);
const oldSettings={name:'もち',habits:['歩く'],showWeight:true,room:'cream'};
await api.POST(request({kind:'settings',...oldSettings}));data=await(await api.GET()).json();assert.equal(data.settings.species,'penguin');assert.equal(data.settings.outfit,'bandana');assert.equal(data.settings.goal,goal);
user={userId:'legacy-pet',email:'legacy@example.test'};
sqlite.prepare('INSERT INTO profiles(user_id,settings) VALUES(?,?)').run(user.userId,JSON.stringify(oldSettings));
data=await(await api.GET()).json();assert.equal(data.settings.onboardingComplete,true);assert.equal(data.settings.species,'dog');assert.equal(data.settings.outfit,'none');assert.equal(data.settings.habits[0],'歩く');assert.equal(data.settings.goal,'');
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
// Notes survive old clients, remain private and do not farm rewards.
user={userId:'notes-a',email:'notes@example.test'};
const note='今日のよかったこと\nもちに会えた <script>alert(1)</script>';
let noteResponse=await api.POST(request({...body,weight:null,mood:null,done:[],note}));assert.equal(noteResponse.status,200);
data=await noteResponse.json();assert.equal(data.entries[0].note,note);assert.equal(data.stars,0);
await api.POST(request({...body,weight:null}));data=await(await api.GET()).json();assert.equal(data.entries[0].note,note);
assert.equal((await api.POST(request({...body,note:'あ'.repeat(2001)}))).status,400);
assert.equal((await api.POST(request({...body,note:12}))).status,400);
const exported=await exportApi.GET();assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition'),/attachment/);assert.match(exported.headers.get('cache-control'),/no-store/);
const backup=await exported.json();assert.equal(backup.format,'mochi-days-export');assert.equal(backup.entries[0].note,note);assert.equal(backup.version,1);assert.equal(backup.userId,undefined);
user={userId:'notes-b',email:'other@example.test'};const other=await(await exportApi.GET()).json();assert.equal(other.entries.length,0);
user={userId:'notes-a',email:'notes@example.test'};await api.POST(request({...body,note:''}));data=await(await api.GET()).json();assert.equal(data.entries[0].note,'');
// Walking duration is validated, private, persistent and preserved for older clients.
user={userId:'walking-a',email:'walk@example.test'};
const walkBody={...body,walkingMinutes:35,note:'歩いた日のメモ'};
for(const walkingMinutes of [-1,2.5,1441,'30'])assert.equal((await api.POST(request({...walkBody,walkingMinutes}))).status,400);
let walkingResponse=await api.POST(request(walkBody));assert.equal(walkingResponse.status,200);
data=await walkingResponse.json();assert.equal(data.entries[0].walkingMinutes,35);assert.equal(data.entries[0].weight,60);assert.equal(data.entries[0].note,walkBody.note);assert.deepEqual(data.entries[0].done,['h0']);const walkingStars=data.stars;
const {walkingMinutes:omitted,...oldBody}=walkBody;
await api.POST(request({...oldBody,weight:61}));data=await(await api.GET()).json();assert.equal(data.entries[0].walkingMinutes,35);assert.equal(data.stars,walkingStars);
await api.POST(request({...walkBody,walkingMinutes:0}));data=await(await api.GET()).json();assert.equal(data.entries[0].walkingMinutes,0);
await api.POST(request({...walkBody,walkingMinutes:null}));data=await(await api.GET()).json();assert.equal(data.entries[0].walkingMinutes,null);
await api.POST(request(walkBody));const walkingExport=await(await exportApi.GET()).json();assert.equal(walkingExport.entries[0].walkingMinutes,35);
user={userId:'walking-b',email:'walk-b@example.test'};assert.equal((await(await api.GET()).json()).entries.length,0);assert.equal((await(await exportApi.GET()).json()).entries.length,0);
// Earn the whole collection through real entries, then check the final unlock boundary.
user={userId:'all-rewards',email:'rewards@example.test'};
for(let i=89;i>=0;i--){
 const earned=await api.POST(request({kind:'entry',day:helpers.daysAgo(helpers.today(),i),weight:60,walkingMinutes:20,mood:0,done:i===0?['h0','h1']:['h0','h1','h2'],note:'ごほうびを集めた日'}));
 assert.equal(earned.status,200);
}
data=await(await api.GET()).json();assert.equal(data.stars,449);
assert.equal((await api.POST(request({kind:'settings',...data.settings,outfit:'birthday'}))).status,403);
assert.equal((await api.POST(request({kind:'settings',...data.settings,outfit:'starlight'}))).status,403);
await api.POST(request({kind:'entry',day:helpers.today(),weight:60,walkingMinutes:20,mood:0,done:['h0','h1','h2'],note:'ごほうびを集めた日'}));
data=await(await api.GET()).json();assert.equal(data.stars,450);
for(const species of helpers.speciesIds){
 assert.equal((await api.POST(request({kind:'settings',...data.settings,species,outfit:'starlight'}))).status,200);
 data=await(await api.GET()).json();assert.equal(data.settings.species,species);assert.equal(data.settings.outfit,'starlight');assert.equal(data.stars,450);assert.equal(data.entries.length,90);
}
assert.equal((await api.POST(request({kind:'settings',...oldSettings}))).status,200);
data=await(await api.GET()).json();assert.equal(data.settings.outfit,'starlight');assert.equal(data.settings.species,'penguin');
const rewardBackup=await(await exportApi.GET()).json();assert.equal(rewardBackup.settings.outfit,'starlight');assert.equal(rewardBackup.entries.length,90);assert.equal(rewardBackup.entries[0].walkingMinutes,20);
user={userId:'no-rewards',email:'no-rewards@example.test'};
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,outfit:'starlight'}))).status,403);
console.log('PASS: server collection unlock at 450 earned stars, locked at 449, all three special pets, older-client persistence, export and account isolation.');
console.log('PASS: persisted walking minutes, integer validation, zero/clearing, older-client preservation, unchanged rewards and private export.');
assert.equal(helpers.daysAgo('2026-03-01',1),'2026-02-28');
console.log('PASS: note storage/clearing, old-client preservation, note length/type validation, no note reward inflation, authenticated private export, export account isolation and date boundary.');
console.log('PASS: first-use onboarding, legacy profile/record migration, species and outfit persistence, server-side unlock boundary, invalid pet/outfit rejection, old-client compatibility, progress preservation, per-user wardrobe isolation, sprite cells.');
console.log('PASS: unauthenticated denial, cross-origin denial, input validation, invalid/future dates, ownership isolation, persistent updates, reward deduplication, non-decreasing stars, locked rewards, settings, private caching.');

// Care flags never mutate health data, stars or another person's account.
user={userId:'care-a',email:'care-a@example.test'};
await api.POST(request({...body,walkingMinutes:22,note:'その日のメモ'}));
const careBefore=await(await api.GET()).json();
assert.equal((await api.POST(request({kind:'care',day:helpers.today(),visited:true,resting:true,light:true,quiet:true,finished:true}))).status,200);
data=await(await api.GET()).json();
assert.equal(data.stars,careBefore.stars);
assert.deepEqual({...data.entries[0],care:undefined},{...careBefore.entries[0],care:undefined});
assert.deepEqual(data.entries[0].care,{visited:true,resting:true,light:true,quiet:true,finished:true});
await api.POST(request({kind:'care',day:helpers.today(),finished:false}));
await api.POST(request({...body,weight:61}));
data=await(await api.GET()).json();assert.equal(data.entries[0].care.resting,true);assert.equal(data.entries[0].care.quiet,true);assert.equal(data.entries[0].care.finished,false);assert.equal(data.entries[0].walkingMinutes,22);assert.equal(data.entries[0].note,'その日のメモ');
assert.equal((await api.POST(request({kind:'settings',...data.settings,weeklyDays:3}))).status,200);
await api.POST(request({kind:'settings',...oldSettings}));data=await(await api.GET()).json();assert.equal(data.settings.weeklyDays,3);
const careExport=await(await exportApi.GET()).json();assert.equal(careExport.entries[0].care.resting,true);
for(const bad of [{kind:'care',day:helpers.today()},{kind:'care',day:helpers.today(),visited:false},{kind:'care',day:helpers.daysAgo(helpers.today(),1),visited:true},{kind:'care',day:'2026-02-31',resting:true},{kind:'care',day:helpers.today(),resting:'yes'},{kind:'care',day:helpers.today(),userId:'care-b',resting:true}])assert.equal((await api.POST(request(bad))).status,400);
user={userId:'care-b',email:'care-b@example.test'};
assert.equal((await(await api.GET()).json()).entries.length,0);
await api.POST(request({kind:'care',day:helpers.today(),visited:true}));data=await(await api.GET()).json();
assert.equal(data.entries[0].weight,null);assert.deepEqual(data.entries[0].done,[]);assert.equal(data.stars,0);assert.equal(data.entries[0].care.resting,undefined);
user={userId:'care-a',email:'care-a@example.test'};assert.equal((await(await api.GET()).json()).entries[0].care.resting,true);
console.log('PASS: private care flags, independent partial updates, health preservation, no star farming, weekly pace compatibility, export and validation.');
// New companion state is private, bounded and merged with revision retries.
user={userId:'memories-a',email:'ma@example.test'};
assert.equal((await api.POST(request({kind:'settings',...helpers.defaults,onboardingComplete:true}))).status,200);
const memory=command=>api.POST(request({kind:'companion',command}));
assert.equal((await memory({action:'visit'})).status,200);
const parallel=await Promise.all([memory({action:'preference',patch:{callingName:'はな'}}),memory({action:'preference',patch:{tone:'quiet'}}),memory({action:'like',key:'season',value:'春'})]);assert.ok(parallel.every(response=>response.status===200));
data=await(await api.GET()).json();assert.equal(data.companion.preferences.callingName,'はな');assert.equal(data.companion.preferences.tone,'quiet');assert.equal(data.companion.pets.dog.likes.season,'春');
const emptyHealth=data.entries,starsBefore=data.stars;
await memory({action:'interact',interaction:'hug'});await memory({action:'interact',interaction:'hug'});
data=await(await api.GET()).json();assert.deepEqual(data.entries,emptyHealth);assert.equal(data.stars,starsBefore);assert.equal(data.companion.pets.dog.interactions[helpers.today()].length,1);
assert.equal((await memory({action:'preference',patch:{stars:999}})).status,400);
await api.POST(request({kind:'entry',day:helpers.today(),weight:null,mood:null,done:[],note:'もちへの言葉',partial:['h0'],feelings:['ほっとした'],tags:['忙しい日']}));
data=await(await api.GET()).json();assert.equal(data.stars,0);assert.equal(data.companion.journey.episodes.length,1);assert.deepEqual(data.entries[0].partial,['h0']);assert.deepEqual(data.entries[0].feelings,['ほっとした']);
await api.POST(request({kind:'entry',day:helpers.today(),weight:null,mood:null,done:['h0']}));data=await(await api.GET()).json();assert.deepEqual(data.entries[0].partial,[]);assert.equal(data.entries[0].note,'もちへの言葉');assert.deepEqual(data.entries[0].tags,['忙しい日']);assert.equal(data.stars,1);
const memoryExport=await(await exportApi.GET()).json();assert.equal(memoryExport.companion.preferences.callingName,'はな');
user={userId:'memories-b',email:'mb@example.test'};data=await(await api.GET()).json();assert.equal(data.companion.preferences.callingName,'');assert.deepEqual(data.companion.pets,{});
console.log('PASS: private companion archives and export, overlapping command retries, no star farming, metadata persistence across old clients, partial completion semantics and account isolation.');
sqlite.close();

})().catch(e=>{console.error(e);process.exitCode=1});
