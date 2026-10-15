const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file,mocks={}){const exp={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>mocks[id]??require(id),exp);return exp}
const items=new Map(),removeFailures=new Set();let full=false;
global.localStorage={get length(){return items.size},key:index=>[...items.keys()][index]??null,getItem:key=>items.get(key)??null,setItem(key,value){if(full)throw new Error('quota');items.set(key,String(value))},removeItem(key){if(removeFailures.has(key))throw new Error('blocked');items.delete(key)}};
const assets=load('packages/mochi-assets/index.js'),mochi=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':assets}),content=load('lib/companion-content.ts');
const companion=load('lib/companion.ts',{'./mochi':mochi,'./companion-content':content}),habits=load('lib/habits.ts'),care=load('lib/care.ts',{'./mochi':mochi});
const rules=load('lib/state-rules.ts',{'./mochi':mochi,'./companion':companion,'./companion-content':content});
const guard=load('lib/device-storage-guard.ts');
function reloadGuard(){Object.assign(guard,load('lib/device-storage-guard.ts'));guard.rememberDeviceEpoch()}
const device=load('lib/device-store.ts',{'./mochi':mochi,'./state-rules':rules,'./care':care,'./companion':companion,'./habits':habits,'./device-storage-guard':guard});
const drafts=load('lib/record-drafts.ts',{'./state-rules':rules,'./device-storage-guard':guard});
const key='mochi-days:v1',day=mochi.today(),entry={day,weight:62.5,walkingMinutes:12,mood:1,done:['h0'],note:'合成の記録',care:{visited:true,resting:true}};
let groups=0;
(async()=>{
 await device.requestDeviceState({kind:'settings',...mochi.defaults,onboardingComplete:true,name:'しらたま',species:'cat'});
 await device.requestDeviceState({kind:'entry',...entry});
 await device.requestDeviceState({kind:'care',day,visited:true,resting:true});
 await device.requestDeviceState({kind:'companion',command:{action:'preference',patch:{callingName:'もち',room:{floor:'rug',furniture:'book',weather:'rain',light:'evening',season:'autumn',palette:'warm',keepsakeId:null}}}});
 // Clearing fields does not remove already-earned stars. New backup must preserve their IDs.
 await device.requestDeviceState({kind:'entry',...entry,weight:null,mood:null,done:[]});
 const before=await device.requestDeviceState(),backup=JSON.parse(await device.exportDeviceRecords().text());
 assert.equal(backup.stars,3);assert.equal(backup.starLedger.length,3);
 const current=device.deviceRecordsSnapshot();device.restoreDeviceRecords(JSON.stringify(backup),current);reloadGuard();
 assert.deepEqual(await device.requestDeviceState(),before);
 await device.requestDeviceState({kind:'entry',...entry});assert.equal((await device.requestDeviceState()).stars,3,'Restored IDs prevent duplicate awards');groups++;

 const fresh=JSON.parse(await device.exportDeviceRecords().text()),legacy={...fresh,stars:450};delete legacy.starLedger;delete legacy.companion;
 device.restoreDeviceRecords(JSON.stringify(legacy),device.deviceRecordsSnapshot());reloadGuard();
 let data=await device.requestDeviceState();assert.equal(data.stars,450);assert.equal(data.settings.name,'しらたま');assert.equal(data.entries[0].note,entry.note);
 const legacyAgain=await device.exportDeviceRecords().text();device.restoreDeviceRecords(legacyAgain,device.deviceRecordsSnapshot());reloadGuard();assert.equal((await device.requestDeviceState()).stars,450);groups++;

 // Every invalid import must leave exact stored bytes and drafts unchanged.
 const preserved=device.deviceRecordsSnapshot(),draftKey=drafts.draftKey('device',day,'note');items.set(draftKey,'preserve-draft');
 const invalid=[{...fresh,format:'mochi-care-export'},{...fresh,version:2},{...fresh,unexpected:true},{...fresh,stars:-1},{...fresh,stars:1.5},
  {...fresh,entries:[...fresh.entries,...fresh.entries]}, {...fresh,entries:[{...fresh.entries[0],day:'2999-01-01'}]},
  {...fresh,entries:[{...fresh.entries[0],day:'2026-02-31'}]}, {...fresh,entries:[{...fresh.entries[0],userId:'other'}]},
  {...fresh,settings:{...fresh.settings,name:'あ'.repeat(13)}}, {...fresh,settings:{...fresh.settings,habits:42}},
  {...fresh,starLedger:['bad','bad','bad']}, {...fresh,companion:{version:999}}, {...fresh,companion:JSON.parse('{"version":1,"__proto__":{}}')}];
 for(const value of invalid){assert.throws(()=>device.restoreDeviceRecords(JSON.stringify(value),preserved));assert.equal(device.deviceRecordsSnapshot(),preserved);assert.equal(items.get(draftKey),'preserve-draft')}
 assert.throws(()=>device.restoreDeviceRecords('{',preserved));
 assert.throws(()=>device.inspectDeviceBackup(' '.repeat(device.MAX_BACKUP_BYTES+1)));groups++;

 full=true;assert.throws(()=>device.restoreDeviceRecords(JSON.stringify(fresh),preserved));full=false;
 assert.equal(device.deviceRecordsSnapshot(),preserved);assert.equal(items.get(draftKey),'preserve-draft');
 assert.throws(()=>device.restoreDeviceRecords(JSON.stringify(fresh),'stale snapshot'));assert.equal(device.deviceRecordsSnapshot(),preserved);groups++;

 // Restore clears only known Pages auxiliary keys; delete never clears an origin.
 const keep=['mochi-care:v1','other-app','mochi-days:draft:v1:another-user:'+day+':note','mochi-days:other-app:v1'];
 for(const name of keep)items.set(name,'untouched');
 const own=[draftKey,'mochi-days:timer:v1:device','mochi-days:walking-record-timer:v1:device:'+day];
 for(const name of own)items.set(name,'synthetic');
 assert.equal(device.restoreDeviceRecords(JSON.stringify(fresh),preserved).draftsCleared,true);reloadGuard();
 for(const name of own)assert(!items.has(name));for(const name of keep)assert.equal(items.get(name),'untouched');groups++;

 for(const name of own)items.set(name,'synthetic');removeFailures.add(draftKey);
 assert.throws(()=>device.deleteDeviceRecords(device.deviceRecordsSnapshot()));assert(items.has(key));
 assert.equal(device.restoreDeviceRecords(JSON.stringify(fresh),device.deviceRecordsSnapshot()).draftsCleared,false);reloadGuard();
 removeFailures.clear();removeFailures.add(key);assert.throws(()=>device.deleteDeviceRecords(device.deviceRecordsSnapshot()));assert(items.has(key));removeFailures.clear();
 device.deleteDeviceRecords(device.deviceRecordsSnapshot());reloadGuard();assert(!items.has(key));for(const name of own)assert(!items.has(name));for(const name of keep)assert.equal(items.get(name),'untouched');groups++;

 // A stale tab cannot recreate health data/drafts even if its navigation is cancelled.
 // Deleting auxiliary-only data still rotates the marker when the main key is already absent.
 const staleGuard=load('lib/device-storage-guard.ts');staleGuard.rememberDeviceEpoch();
 const staleDevice=load('lib/device-store.ts',{'./mochi':mochi,'./state-rules':rules,'./care':care,'./companion':companion,'./habits':habits,'./device-storage-guard':staleGuard});
 const staleDrafts=load('lib/record-drafts.ts',{'./state-rules':rules,'./device-storage-guard':staleGuard});
 device.deleteDeviceRecords(null);reloadGuard();assert.equal(staleGuard.deviceStorageWritable(),false);
 await assert.rejects(()=>staleDevice.requestDeviceState({kind:'entry',...entry}));
 assert.equal(staleDrafts.writeDraft('device',day,'note',{entry,weight:'62.5',walkingMinutes:'12',weightIncluded:true,walkingIncluded:true,letter:false,at:Date.now()}),false);
 assert(!items.has(key));assert(!items.has(draftKey));groups++;

 const now=Date.now(),base={entry,weight:'62.5',walkingMinutes:'12',weightIncluded:true,walkingIncluded:true,letter:false,at:now};
 drafts.writeDraft('device',day,'note',base);
 drafts.writeDraft('device',mochi.daysAgo(day,8),'note',{...base,entry:{...entry,day:mochi.daysAgo(day,8)},at:now-drafts.DRAFT_MAX_AGE_MS-1});
 const other=drafts.draftKey('another-user',day,'note');items.set(other,JSON.stringify({...base,at:1}));
 const malformed=drafts.draftKey('device',day,'weight');items.set(malformed,'{');items.set(key,'saved-records-must-survive');
 drafts.pruneDrafts('device',now);assert(drafts.readDraft('device',day,'note',now));assert.equal(drafts.readDraft('device',mochi.daysAgo(day,8),'note',now),null);
 assert(!items.has(malformed));assert(items.has(other));assert.equal(items.get(key),'saved-records-must-survive');
 for(const at of [NaN,Infinity,now+6*60*1000,now-drafts.DRAFT_MAX_AGE_MS-1]){drafts.writeDraft('device',day,'note',{...base,at});assert.equal(drafts.readDraft('device',day,'note',now),null)}groups++;
 console.log(JSON.stringify({status:'pass',groups,checks:'validated backup and legacy balance round trips; cleared-entry award deduplication; invalid/quota/stale import preservation; owned-key deletion; partial failures; draft expiry and scope isolation'}));
})().catch(error=>{console.error(error);process.exitCode=1});
