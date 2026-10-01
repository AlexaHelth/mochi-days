const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
function load(path,mocks){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const shared=load('packages/mochi-assets/index.js',{}),mochi=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':shared}),history=load('lib/history.ts',{'./mochi':mochi});
const blank={weight:null,walkingMinutes:null,mood:null,done:[],note:''};
const records=[
 {...blank,day:'2026-02-28',weight:62},
 {...blank,day:'2026-03-01',walkingMinutes:0},
 {...blank,day:'2026-03-23',note:'前の週'},
 {...blank,day:'2026-03-24',note:'今週のメモ\n改行も残す'},
 {...blank,day:'2026-03-25',note:'  '},
 {...blank,day:'2026-03-30',done:['h0']},
 {...blank,day:'2026-03-31',weight:60},
];
const before=JSON.stringify(records);
assert.deepEqual(history.recentEntries(records,'2026-03-30').map(e=>e.day),['2026-03-30','2026-03-24','2026-03-23','2026-03-01']);
assert.deepEqual(history.recentEntries(records,'2026-03-30',7).map(e=>e.day),['2026-03-30','2026-03-24']);
assert.equal(history.recentEntries(records,'2026-03-30')[1].note,'今週のメモ\n改行も残す');
assert.equal(JSON.stringify(records),before,'Viewing recent history must not reorder or discard stored data');
assert.equal(history.hasRecord({...blank,day:'2026-03-30',walkingMinutes:0}),true);
assert.equal(history.hasRecord({...blank,day:'2026-03-30',note:'  '}),false);
assert.equal(mochi.allRewardsUnlocked(449),false);assert.equal(mochi.allRewardsUnlocked(450),true);
assert.equal(mochi.allRewardsUnlocked(Infinity),false);assert.equal(mochi.allRewardsUnlocked(NaN),false);
console.log('PASS: inclusive 30-day and 7-day history across month boundaries, newest-first ordering, future/blank exclusion, walking zero, notes and unchanged stored records.');
