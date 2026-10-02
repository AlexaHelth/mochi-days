const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path,mocks){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const assets=load('packages/mochi-assets/index.js',{}),mochi=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':assets}),care=load('lib/care.ts',{'./mochi':mochi}),history=load('lib/history.ts',{'./mochi':mochi});
const blank={weight:null,walkingMinutes:null,mood:null,done:[],note:''};
assert.deepEqual(care.calendarWeek('2026-10-04'),['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
assert.deepEqual(care.calendarWeek('2026-10-05'),['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11']);
assert.equal(care.welcomeKind([],'2026-10-02'),'first');
assert.equal(care.welcomeKind([{...blank,day:'2026-09-28',note:'前の記録'}],'2026-10-02'),'return');
assert.equal(care.welcomeKind([{...blank,day:'2026-10-01',walkingMinutes:0}],'2026-10-02'),'familiar');
assert.equal(care.welcomeKind([{...blank,day:'2026-10-02',care:{visited:true}}],'2026-10-02'),'today');
assert.equal(care.welcomeKind([{...blank,day:'2026-10-03',care:{visited:true}}],'2026-10-02'),'first');
assert.match(care.welcomeText('return',8),/また会えてうれしい/);assert.match(care.welcomeText('familiar',23),/休もう/);
const days=[{...blank,day:'2026-10-01',care:{visited:true,resting:true}},{...blank,day:'2026-10-02',care:{visited:true}},{...blank,day:'2026-09-30',care:{light:true,quiet:true,finished:true}}];
const before=JSON.stringify(days);assert.deepEqual(care.visitDays(days),['2026-10-01','2026-10-02']);
assert.equal(history.hasRecord(days[0]),true);assert.equal(history.hasRecord(days[1]),false);assert.equal(history.hasRecord(days[2]),false);
assert.deepEqual(history.recentEntries(days,'2026-10-02').map(e=>e.day),['2026-10-01']);
assert.equal(JSON.stringify(days),before);
assert.deepEqual(care.mergeCare({visited:true,resting:true,light:true},{quiet:true,finished:false}),{visited:true,resting:true,light:true,quiet:true,finished:false});
assert.equal(mochi.normalizeSettings({goal:'以前の目標',weeklyDays:2}).weeklyDays,2);
for(const weeklyDays of [undefined,0,8,2.5,'2'])assert.equal(mochi.normalizeSettings({weeklyDays}).weeklyDays,null);
assert.equal(mochi.normalizeSettings(null).goal,'');assert.equal(mochi.normalizeSettings({goal:'前の目標'}).goal,'前の目標');
for(const goal of ['週3日、10分のおさんぽ','産後はゆっくり体を整える','自分の目標']){
 const original=goal,choices=care.smallerGoals(goal);assert.equal(choices.length,3);assert.ok(choices.every(choice=>choice.length<=80&&choice.trim()));assert.equal(goal,original);
}
console.log('PASS: Japanese calendar weeks, welcome after absence, visit/health distinction, rest history, immutable partial care, old settings and optional smaller-goal choices.');
