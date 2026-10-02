const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('lib/habits.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const habits={};new Function('exports',code)(habits);
assert.equal(habits.habitIdeas.length,180);
assert.equal(new Set(habits.habitIdeas.map(idea=>idea.name)).size,180);
assert.ok(habits.habitIdeas.every(idea=>idea.name.length<=30));
const combinations=new Set(),seen=new Set();
for(let offset=0;offset<365;offset++){
 const day=new Date(Date.UTC(2026,9,3+offset)).toISOString().slice(0,10),names=habits.dailyHabitIdeas(day);
 assert.equal(names.length,3);assert.equal(new Set(names).size,3);
 assert.deepEqual(names,habits.dailyHabitIdeas(day));
 assert.equal(new Set(names.map(habits.habitTheme)).size,3);
 names.forEach(name=>{assert.ok(habits.habitIdeas.some(idea=>idea.name===name));seen.add(name)});
 combinations.add(JSON.stringify(names));
}
assert.ok(combinations.size>350);assert.ok(seen.size>150);
const day='2026-10-03',legacy=['以前の散歩','以前のストレッチ','以前の食事'];
const blank={day,done:[]};
assert.deepEqual(habits.habitNamesFor(blank,legacy),habits.dailyHabitIdeas(day));
assert.deepEqual(habits.habitNamesFor({...blank,done:['h0']},legacy),legacy);
assert.deepEqual(habits.habitNamesFor({...blank,partial:['h1']},legacy),legacy);
assert.deepEqual(habits.habitNamesFor({...blank,day:'2026-10-02'},legacy),legacy);
const snapshot=habits.dailyHabitIdeas(day),entry={...blank,habitNames:snapshot,done:['h0']};
assert.deepEqual(habits.habitNamesFor(entry,['変えた設定']),snapshot);
const copy=habits.habitNamesFor(entry);copy[0]='別の名前';assert.deepEqual(entry.habitNames,snapshot);
assert.notDeepEqual(habits.dailyHabitIdeas(day),habits.dailyHabitIdeas('2026-10-04'));
console.log('PASS: 180 unique micro-habits, varied dated choices in three categories, stable reloads, frozen snapshots and legacy completion labels.');
