const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path,mocks={}){const exp={};new Function('require','exports',ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>mocks[id]??require(id),exp);return exp}
const assets=load('packages/mochi-assets/index.js'),mochi=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':assets}),content=load('lib/companion-content.ts');
const lib=load('lib/companion.ts',{'./mochi':mochi,'./companion-content':content}),rules=load('lib/state-rules.ts',{'./mochi':mochi,'./companion':lib,'./companion-content':content});
const day='2026-10-02',blank=date=>({day:date,weight:null,walkingMinutes:null,mood:null,done:[],note:''});
let ctx={day,settings:{...mochi.defaults,onboardingComplete:true,name:'もち',goal:'少し歩く'},entries:[],stars:0},state=lib.newCompanion(ctx);
const act=command=>state=lib.applyCompanionAction(state,command,ctx);
act({action:'visit'});act({action:'visit'});assert.deepEqual(state.pets.dog.visits,[day]);
act({action:'interact',interaction:'pet'});act({action:'interact',interaction:'pet'});assert.equal(lib.bondCount(state.pets.dog),1);assert.equal(state.gifts.length,0);
for(const kind of lib.interactionKinds)act({action:'interact',interaction:kind});assert.equal(lib.bondCount(state.pets.dog),11);assert.equal(state.gifts.length,0);
act({action:'personality',value:'shy'});act({action:'talk',choice:1});assert.equal(state.pets.dog.likes[lib.dailyQuestion(day).key],lib.dailyQuestion(day).options[1]);
act({action:'like',key:'season',value:'春'});act({action:'preference',patch:{callingName:'はな',tone:'quiet',support:'listen'}});assert.match(lib.dailyGreeting(state.pets.dog,state.preferences,null,''),/はな、.*春/);assert.match(lib.dailyGreeting(state.pets.dog,state.preferences,2,''),/静かに/);
act({action:'step'});act({action:'bedtime',selfWords:'おつかれさま',tomorrow:'もちとお茶'});assert.equal(state.daily[day].step,lib.goalStep(ctx.settings.goal));assert.equal(state.daily[day].tomorrow,'もちとお茶');
const dog=structuredClone(state.pets.dog);
ctx.settings={...ctx.settings,species:'cat',name:'しらたま'};act({action:'visit'});act({action:'like',key:'season',value:'冬'});act({action:'interact',interaction:'hug'});assert.deepEqual(state.pets.dog,dog);assert.equal(state.pets.cat.name,'しらたま');assert.equal(state.pets.cat.likes.season,'冬');assert.equal(state.gifts.length,0);
ctx.settings={...ctx.settings,species:'dog',name:'もち'};act({action:'visit'});assert.equal(state.pets.dog.personality,'shy');assert.equal(state.pets.dog.likes.season,'春');
// Saved gifts and room selections survive the feature's retirement unchanged.
const archivedGifts=[
 {id:'daily:2026-10-01',label:'今日の小さなお花',note:'保存していた思い出',day:'2026-10-01',species:'dog',available:true,opened:true},
 {id:'souvenir:story:2026-09-30:dog',label:'小さな葉っぱ',note:'木もれびの入口',day:'2026-09-30',species:'dog',available:false,opened:false,episodeId:'story:2026-09-30:dog'},
 {id:'season:spring:dog',label:'春の白い花',note:'季節の思い出',day:'2026-04-01',species:'dog',available:true,opened:true},
];
state.gifts=structuredClone(archivedGifts);state.preferences.room.keepsakeId=archivedGifts[0].id;
state=lib.normalizeCompanion(JSON.parse(JSON.stringify(state)),ctx);assert.deepEqual(state.gifts,archivedGifts);assert.equal(state.preferences.room.keepsakeId,archivedGifts[0].id);
act({action:'visit'});act({action:'interact',interaction:'pet'});assert.deepEqual(state.gifts,archivedGifts);
// Every meaningful field still starts one story, without creating gifts or extra stars.
for(const patch of [{weight:60},{walkingMinutes:0},{mood:2},{done:['h0']},{partial:['h0']},{note:'ひとこと'},{feelings:['ほっとした']},{tags:['忙しい日']},{care:{resting:true}}]){
 const context={...ctx,entries:[{...blank(day),...patch}]};let single=lib.syncCompanion(lib.newCompanion({...ctx,entries:[]}),context);
 assert.equal(single.gifts.length,0);assert.equal(single.journey.episodes.length,1);
 single=lib.syncCompanion(single,context);assert.equal(single.journey.episodes.length,1);assert.equal(single.gifts.length,0);
 assert.equal(rules.starActions({kind:'entry',...context.entries[0]}).length,patch.weight?1:patch.mood!=null?1:patch.done?1:0);
 single=lib.applyCompanionAction(single,{action:'visit'},context);assert.equal(single.gifts.length,0);assert.deepEqual(single.pets.dog.visits,[day]);
 if(patch.care)assert.equal(single.journey.episodes[0].resting,true);
}
ctx.entries=[{...blank(day),note:'最初の記録',walkingMinutes:30}];act({action:'route',route:'sea'});const episode=state.journey.episodes.at(-1); // route applies to the next chapter
act({action:'story',id:episode.id,choice:1});const chosen=episode.choices[1];assert.deepEqual(state.gifts,archivedGifts);
ctx={...ctx,day:'2026-10-03',entries:[{...blank('2026-10-03'),mood:1},...ctx.entries]};state=lib.syncCompanion(state,ctx);assert.equal(state.journey.episodes.at(-1).route,'sea');assert.match(state.journey.episodes.at(-1).text,new RegExp(chosen));assert.equal(lib.walkingJourney(ctx.entries),30);assert.deepEqual(state.gifts,archivedGifts);assert.equal(state.preferences.room.keepsakeId,archivedGifts[0].id);
ctx={...ctx,day:'2026-11-29'};act({action:'visit'});assert.equal(lib.bondCount(state.pets.dog),11);assert.deepEqual(state.gifts,archivedGifts);
// Old clients can submit retired commands safely, but cannot open or create gifts.
for(const gift of archivedGifts)act({action:'openGift',id:gift.id});act({action:'openGift',id:'missing'});
for(const [id] of content.seasonStories){act({action:'seasonGift',season:id});act({action:'seasonGift',season:id});}assert.deepEqual(state.gifts,archivedGifts);
// Legacy room preferences keep their bounded validation and omit-field behavior.
const displayed=state.gifts.find(g=>g.opened),wrapped=state.gifts.find(g=>!g.opened);
assert.throws(()=>act({action:'preference',patch:{room:{...state.preferences.room,keepsakeId:'missing'}}}));
assert.ok(wrapped);assert.throws(()=>act({action:'preference',patch:{room:{...state.preferences.room,keepsakeId:wrapped.id}}}));
act({action:'preference',patch:{room:{...state.preferences.room,keepsakeId:displayed.id}}});
assert.equal(state.preferences.room.keepsakeId,displayed.id);
assert.equal(lib.normalizeCompanion(JSON.parse(JSON.stringify(state)),ctx).preferences.room.keepsakeId,displayed.id);
const {keepsakeId,...oldRoom}=state.preferences.room;
act({action:'preference',patch:{room:oldRoom}});assert.equal(state.preferences.room.keepsakeId,displayed.id);
act({action:'preference',patch:{room:{...state.preferences.room,keepsakeId:null}}});assert.equal(state.preferences.room.keepsakeId,null);
const room={floor:'rug',furniture:'book',weather:'snow',light:'night',season:'spring',palette:'clear',keepsakeId:null};act({action:'preference',patch:{room,wishlist:'sailor'}});act({action:'roomFavorite',name:'夜のお部屋'});assert.deepEqual(state.preferences.favorites[0].design,room);
act({action:'preference',patch:{room:{...room,light:'morning'}}});assert.equal(state.preferences.favorites[0].design.light,'night');
for(const name of ['朝','昼','夕方'])act({action:'roomFavorite',name});assert.throws(()=>act({action:'roomFavorite',name:'5つ目'}));act({action:'removeFavorite',index:1});assert.equal(state.preferences.favorites.length,3);
const before=structuredClone(state);ctx={...ctx,stars:5};state=lib.syncCompanion(state,ctx);assert.equal(state.receipts.bandana.seen,false);assert.match(state.receipts.bandana.source,/記録/);assert.equal(lib.rewardSource({...blank(day),note:'昨日からのメモ'},{...blank(day),note:'昨日からのメモ',weight:60}),'体重を残した日');act({action:'receipt',id:'bandana'});assert.equal(state.receipts.bandana.seen,true);assert.throws(()=>act({action:'receipt',id:'starlight'}));
assert.equal(lib.newCompanion(ctx).receipts.bandana.seen,true); // Old unlocked closets never flood the user with packages.
assert.equal(rules.lockedReward({...ctx.settings,outfit:'bandana'},5),null);assert.match(rules.lockedReward({...ctx.settings,outfit:'ribbon'},5),/衣装/);assert.equal(rules.lockedReward({...ctx.settings,room:'peach'},10),null);
const savedReceipt=structuredClone(state.receipts.bandana);state=lib.syncCompanion(state,{...ctx,stars:12,source:'気分を残した日'});assert.deepEqual(state.receipts.bandana,savedReceipt);assert.equal(state.receipts.ribbon.source,'気分を残した日');assert.deepEqual(state.gifts,archivedGifts);
assert.ok(lib.normalizeCompanion(state,ctx).pets.dog);assert.throws(()=>lib.normalizeCompanion({version:10},ctx),/読み込めません/);
for(const command of [{action:'interact',interaction:'fake'},{action:'talk',choice:2},{action:'preference',patch:{stars:999}},{action:'preference',patch:{volume:1}},{action:'story',id:'missing',choice:0},{action:'visit',userId:'other'}])assert.throws(()=>lib.applyCompanionAction(before,command,ctx));
assert.equal(lib.anniversary('2026-01-31','2026-02-28'),1);assert.equal(lib.anniversary('2024-02-29','2025-02-28'),12);assert.equal(lib.anniversary(day,day),null);
const visits=Array.from({length:30},(_,i)=>mochi.daysAgo(day,i)),profile={...dog,visits};const letters=lib.lettersFor(profile,day,2);assert.ok(letters.some(l=>l.id==='thanks-7'));assert.ok(letters.some(l=>l.id==='thanks-30'));assert.ok(letters.some(l=>l.id.startsWith('week-')));
assert.equal(lib.plantStage({...profile,interactions:Object.fromEntries(visits.map(date=>[date,['pet']]))}),4);
assert.equal(lib.recordReply({...blank(day),weight:60},{...blank(day),weight:61}),lib.recordReply({...blank(day),weight:60},{...blank(day),weight:59}));
assert.match(lib.recordReply(blank(day),{...blank(day),walkingMinutes:10}),/おかえり/);assert.match(lib.recordReply(blank(day),{...blank(day),note:'秘密'}),/ありがとう/);
for(const route of ['forest','town','sea'])for(let i=0;i<10;i++){const story=content.journeyScene(route,i);assert.equal(story.choices.length,2);assert.ok(story.text.length<180);}
assert.equal(content.afterStories.length,4);
// Timer pause/reload, private draft isolation, corrupt drafts and quota failures.
const timer=load('lib/activity-timer.ts');assert.equal(timer.timerElapsed({kind:'walk',seconds:30,started:1000},61000),90);assert.equal(timer.timerElapsed(timer.pausedTimer({kind:'walk',seconds:30,started:1000},61000),999000),90);assert.equal(timer.readTimer('{').seconds,0);
const items=new Map();let full=false;global.localStorage={getItem:k=>items.get(k)??null,setItem(k,v){if(full)throw Error('full');items.set(k,v)},removeItem:k=>items.delete(k)};
const drafts=load('lib/record-drafts.ts',{'./state-rules':rules}),draft={entry:{...blank(day),note:'書きかけ'},weight:'60.1',weightIncluded:false,walkingMinutes:'20',walkingIncluded:false,letter:true,at:1};
assert.ok(drafts.writeDraft('a',day,'note',draft));assert.equal(drafts.readDraft('a',day,'note').entry.note,'書きかけ');assert.equal(drafts.readDraft('b',day,'note'),null);assert.equal(drafts.readDraft('a',day,'walking'),null);full=true;assert.equal(drafts.writeDraft('a',day,'note',{...draft,weight:'61'}),false);full=false;assert.equal(drafts.readDraft('a',day,'note').weight,'60.1');drafts.clearDraft('a',day,'note');assert.equal(drafts.readDraft('a',day,'note'),null);
console.log('PASS: companion memories for each pet; non-decaying bond and plant; optional talk, tone, goals and bedtime; stories without new gifts; preserved legacy gift data and room preferences; safe retired commands; route, branches and rest stories; room presets; star unlocks and receipt metadata; anniversary and weekly letters; neutral health replies; paused timers; private persistent drafts.');
