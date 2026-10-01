const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path,mocks){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const items=new Map();let full=false;
global.localStorage={getItem:k=>items.has(k)?items.get(k):null,setItem(k,v){if(full)throw new DOMException('Quota exceeded','QuotaExceededError');items.set(k,String(v))},removeItem:k=>items.delete(k)};
const shared=load('packages/mochi-assets/index.js',{});const helpers=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':shared});
const rules=load('lib/state-rules.ts',{'./mochi':helpers});const device=load('lib/device-store.ts',{'./mochi':helpers,'./state-rules':rules});
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
})().catch(e=>{console.error(e);process.exitCode=1});
