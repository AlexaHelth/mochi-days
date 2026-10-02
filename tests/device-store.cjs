const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path,mocks){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const items=new Map();let full=false;
global.localStorage={getItem:k=>items.has(k)?items.get(k):null,setItem(k,v){if(full)throw new DOMException('Quota exceeded','QuotaExceededError');items.set(k,String(v))},removeItem:k=>items.delete(k)};
const shared=load('packages/mochi-assets/index.js',{});const helpers=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':shared});
const content=load('lib/companion-content.ts',{}),companion=load('lib/companion.ts',{'./mochi':helpers,'./companion-content':content});const rules=load('lib/state-rules.ts',{'./mochi':helpers,'./companion':companion,'./companion-content':content}),care=load('lib/care.ts',{'./mochi':helpers});const device=load('lib/device-store.ts',{'./mochi':helpers,'./state-rules':rules,'./care':care,'./companion':companion});
const request=device.requestDeviceState,today=helpers.today(),yesterday=helpers.daysAgo(today,1);
const body={kind:'entry',day:today,weight:60,mood:0,done:['h0']};
(async()=>{
let data=await request();assert.equal(data.entries.length,0);assert.equal(data.stars,0);assert.equal(data.settings.onboardingComplete,false);assert.equal(data.settings.species,'dog');
for(const bad of [{...body,weight:-3},{...body,day:'2026-02-31'},{...body,day:'2999-01-01'},{...body,userId:'other'},{...body,note:'あ'.repeat(2001)},{...body,note:12},{kind:'settings',...helpers.defaults,species:'dragon'},{kind:'settings',...helpers.defaults,outfit:'unknown'}])await assert.rejects(()=>request(bad));
assert.equal(items.size,0);
// First use: choose once, then records and stars behave like the Sites API.
data=await request({kind:'settings',...helpers.defaults,name:'  しらたま  ',species:'cat'});assert.equal(data.settings.name,'しらたま');assert.equal(data.settings.species,'cat');assert.equal(data.settings.onboardingComplete,true);
data=await request(body);assert.equal(data.stars,3);assert.equal(data.entries[0].weight,60);
await request(body);data=await request({...body,done:[]});assert.equal(data.stars,3);assert.deepEqual(data.entries[0].done,[]);
await assert.rejects(()=>request({kind:'settings',...data.settings,room:'flower'}),/お部屋/);
await assert.rejects(()=>request({kind:'settings',...data.settings,outfit:'bandana'}),/衣装/);
data=await request({...body,done:['h0','h1','h2']});assert.equal(data.stars,5);
data=await request({kind:'settings',...data.settings,outfit:'bandana'});assert.equal(data.settings.outfit,'bandana');
await assert.rejects(()=>request({kind:'settings',...data.settings,outfit:'ribbon'}),/衣装/);
data=await request({kind:'settings',...data.settings,species:'penguin',onboardingComplete:false});assert.equal(data.settings.species,'penguin');assert.equal(data.settings.outfit,'bandana');assert.equal(data.settings.onboardingComplete,true);assert.equal(data.stars,5);
const goal='休日に、もちと15分のおさんぽ';
for(const badGoal of [12,null,'あ'.repeat(81)])await assert.rejects(()=>request({kind:'settings',...data.settings,goal:badGoal}));
data=await request({kind:'settings',...data.settings,goal:'  '+goal+'  '});assert.equal(data.settings.goal,goal);assert.equal(data.entries.length,1);assert.equal(data.entries[0].weight,60);assert.equal(data.stars,5);
data=await request({kind:'settings',name:'もち',habits:['歩く'],showWeight:true,room:'cream'});assert.equal(data.settings.species,'penguin');assert.equal(data.settings.outfit,'bandana');assert.deepEqual(data.settings.habits,['歩く']);assert.equal(data.settings.goal,goal);
// Notes: kept for old clients, cleared on request, never farm stars.
const note='今日のよかったこと\nもちに会えた <script>alert(1)</script>';
data=await request({kind:'entry',day:yesterday,weight:null,mood:null,done:[],note});assert.equal(data.stars,5);assert.deepEqual(data.entries.map(e=>e.day),[today,yesterday]);
data=await request({kind:'entry',day:yesterday,weight:null,mood:1,done:[]});assert.equal(data.entries[1].note,note);assert.equal(data.stars,6);
data=await request({kind:'entry',day:yesterday,weight:null,mood:1,done:[],note:''});assert.equal(data.entries[1].note,'');
// Records survive a reload under one namespaced key; the Pages origin is shared with the account's other sites.
assert.deepEqual([...items.keys()],['mochi-days:v1']);const before=items.get('mochi-days:v1');
assert.deepEqual(await request(),data);
full=true;await assert.rejects(()=>request({...body,weight:61}),/保存できませんでした/);full=false;
assert.equal(items.get('mochi-days:v1'),before);assert.equal((await request()).entries[0].weight,60);
items.set('mochi-days:v1','{');await assert.rejects(()=>request(),/読み込めませんでした/);items.set('mochi-days:v1',before);
const file=device.exportDeviceRecords();assert.match(file.name,/^mochi-days-\d{4}-\d{2}-\d{2}\.json$/);
const backup=JSON.parse(await file.text());assert.equal(backup.format,'mochi-days-export');assert.equal(backup.version,1);assert.equal(backup.stars,6);assert.equal(backup.entries.length,2);assert.equal(backup.settings.species,'penguin');assert.equal(backup.settings.goal,goal);
// Walking durations persist without adding rewards; omitted fields from older clients keep them.
const walkBefore=await request(),dayBefore=walkBefore.entries.find(e=>e.day===today);
const walkBody={kind:'entry',...dayBefore,walkingMinutes:35};
for(const walkingMinutes of [-1,2.5,1441,'30'])await assert.rejects(()=>request({...walkBody,walkingMinutes}));
data=await request(walkBody);assert.equal(data.entries[0].walkingMinutes,35);assert.equal(data.stars,walkBefore.stars);
assert.deepEqual({...data.entries[0],walkingMinutes:undefined},{...dayBefore,walkingMinutes:undefined});
const {walkingMinutes:omitted,...oldBody}=walkBody;
data=await request({...oldBody,weight:61});assert.equal(data.entries[0].walkingMinutes,35);
data=await request({...walkBody,walkingMinutes:0});assert.equal(data.entries[0].walkingMinutes,0);
data=await request({...walkBody,walkingMinutes:null});assert.equal(data.entries[0].walkingMinutes,null);
data=await request(walkBody);assert.deepEqual(await request(),data);
const walkExport=JSON.parse(await device.exportDeviceRecords().text());assert.equal(walkExport.entries[0].walkingMinutes,35);
// Earn all rewards through recorded days, without injecting a star balance.
items.clear();
for(let i=89;i>=0;i--)data=await request({kind:'entry',day:helpers.daysAgo(today,i),weight:60,walkingMinutes:20,mood:0,done:i===0?['h0','h1']:['h0','h1','h2'],note:'ごほうびを集めた日'});
assert.equal(data.stars,449);
await assert.rejects(()=>request({kind:'settings',...data.settings,outfit:'birthday'}),/衣装/);
await assert.rejects(()=>request({kind:'settings',...data.settings,outfit:'starlight'}),/特別/);
data=await request({kind:'entry',day:today,weight:60,walkingMinutes:20,mood:0,done:['h0','h1','h2'],note:'ごほうびを集めた日'});assert.equal(data.stars,450);
for(const outfit of helpers.regularOutfits){
 data=await request({kind:'settings',...data.settings,outfit:outfit.id});assert.equal(data.settings.outfit,outfit.id);assert.equal(data.stars,450);
}
for(const species of helpers.speciesIds){
 data=await request({kind:'settings',...data.settings,species,outfit:'starlight'});
 assert.equal(data.settings.species,species);assert.equal(data.settings.outfit,'starlight');assert.equal(data.stars,450);assert.equal(data.entries.length,90);
 assert.deepEqual(await request(),data);
}
data=await request({kind:'settings',name:'もち',habits:['歩く'],showWeight:true,room:'cream'});assert.equal(data.settings.outfit,'starlight');assert.equal(data.settings.species,'penguin');
const rewardExport=JSON.parse(await device.exportDeviceRecords().text());assert.equal(rewardExport.settings.outfit,'starlight');assert.equal(rewardExport.entries.length,90);assert.equal(rewardExport.entries[0].walkingMinutes,20);
console.log('PASS: device collection unlock at 450 earned stars, locked at 449, all 32 outfits, three special pets, reload, older-client persistence and export.');
console.log('PASS: integer walking validation, optional/zero/clear semantics, reload, older-client preservation, unchanged rewards and exported duration.');
console.log('PASS: device storage validation, first-use choice, star deduplication, reward unlocks, old-client settings, note preservation, namespaced persistence, write failure, corrupted storage and export.');

// Daily care is independent of health data and the star ledger.
const preserved=JSON.parse(JSON.stringify(data));
data=await request({kind:'care',day:today,visited:true,resting:true,light:true,quiet:true,finished:true});
assert.equal(data.stars,preserved.stars);assert.equal(data.settings.outfit,'starlight');
assert.deepEqual({...data.entries[0],care:undefined},{...preserved.entries[0],care:undefined});
assert.deepEqual(data.entries[0].care,{visited:true,resting:true,light:true,quiet:true,finished:true});
assert.deepEqual(await request(),data);
data=await request({kind:'care',day:today,finished:false});assert.equal(data.entries[0].care.resting,true);assert.equal(data.entries[0].care.quiet,true);
data=await request({kind:'entry',...data.entries[0],note:'休んだ日のメモ',care:{visited:false,resting:false}});
assert.equal(data.entries[0].care.resting,true,'Health edits cannot clear an independently saved rest choice');
assert.equal(data.entries[0].care.visited,true);assert.equal(data.stars,450);
const oldGoal=data.settings.goal;
data=await request({kind:'settings',...data.settings,weeklyDays:2});
data=await request({kind:'settings',name:'もち',habits:['歩く'],showWeight:true,room:'cream'});
assert.equal(data.settings.weeklyDays,2);assert.equal(data.settings.goal,oldGoal);
for(const bad of [{kind:'care',day:today},{kind:'care',day:today,visited:false},{kind:'care',day:today,resting:'yes'},{kind:'care',day:yesterday,visited:true},{kind:'care',day:'2999-01-01',resting:true},{kind:'care',day:today,stars:450,resting:true}])await assert.rejects(()=>request(bad));
for(const weeklyDays of [0,8,1.2,'2'])await assert.rejects(()=>request({kind:'settings',...data.settings,weeklyDays}));
assert.equal(JSON.parse(await device.exportDeviceRecords().text()).entries[0].care.resting,true);
items.clear();data=await request({kind:'care',day:today,visited:true});
assert.equal(data.stars,0);assert.equal(data.entries[0].weight,null);assert.equal(data.entries[0].mood,null);assert.deepEqual(data.entries[0].done,[]);
data=await request({kind:'care',day:today,resting:true});assert.equal(data.stars,0);assert.equal(data.entries.length,1);
const restSaved=items.get('mochi-days:v1');full=true;
await assert.rejects(()=>request({kind:'care',day:today,resting:false}),/保存できませんでした/);full=false;
assert.equal(items.get('mochi-days:v1'),restSaved);
console.log('PASS: persisted visits, rest/light/quiet/finished flags, partial care updates, preserved health/wardrobe/stars, old-client compatibility, weekly pacing, validation, export and write failures.');

// Memories persist independently from health and older clients; failed writes are atomic.
items.clear();data=await request({kind:'settings',...helpers.defaults,onboardingComplete:true});
const memory=command=>request({kind:'companion',command});
await memory({action:'visit'});await memory({action:'preference',patch:{callingName:'はな',tone:'quiet'}});await memory({action:'like',key:'season',value:'春'});await memory({action:'interact',interaction:'hug'});
data=await request({kind:'entry',day:today,weight:null,mood:null,done:[],note:'もちへ',partial:['h0'],feelings:['ほっとした'],tags:['忙しい日']});assert.equal(data.stars,0);assert.equal(data.companion.journey.episodes.length,1);
await request({kind:'settings',name:'もち',habits:['歩く'],showWeight:true,room:'cream'});data=await request({kind:'entry',day:today,weight:null,mood:null,done:['h0']});assert.equal(data.companion.preferences.callingName,'はな');assert.equal(data.companion.pets.dog.likes.season,'春');assert.deepEqual(data.entries[0].tags,['忙しい日']);assert.equal(data.entries[0].note,'もちへ');assert.deepEqual(data.entries[0].partial,[]);assert.equal(data.stars,1);
const atomic=items.get('mochi-days:v1');full=true;await assert.rejects(()=>memory({action:'like',key:'season',value:'冬'}),/保存できません/);full=false;assert.equal(items.get('mochi-days:v1'),atomic);
assert.equal((await request()).companion.pets.dog.likes.season,'春');assert.equal(JSON.parse(await device.exportDeviceRecords().text()).companion.preferences.callingName,'はな');
console.log('PASS: persistent companion archive, single-field gifts, independent stars, old-client metadata preservation, export and atomic memory write failures.');
})().catch(e=>{console.error(e);process.exitCode=1});
