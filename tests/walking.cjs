const fs=require('node:fs'), assert=require('node:assert/strict'), ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');
function load(path,mocks={}){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const exp={};new Function('require','exports',code)(id=>mocks[id]??require(id),exp);return exp}
const assets=load('packages/mochi-assets/index.js');
const mochi=load('lib/mochi.ts',{'../packages/mochi-assets/index.js':assets});
const {walkingRecords,previousWalking}=load('lib/walking.ts',{'./mochi':mochi});
const entry=(day,walkingMinutes)=>({day,walkingMinutes,weight:60,mood:0,done:['h0'],note:'保存したメモ'});
const records=[entry('2026-10-01',35),entry('2026-09-29',0),entry('2026-09-30',null),entry('2026-09-27',20),entry('2026-10-02',40),entry('2026-08-31',15),entry('2026-09-28',undefined)];
assert.deepEqual(walkingRecords(records,'2026-10-01').map(e=>[e.day,e.walkingMinutes]),[['2026-09-27',20],['2026-09-29',0],['2026-10-01',35]]);
assert.deepEqual(walkingRecords(records,'2026-10-01',2).map(e=>e.walkingMinutes),[35]);
assert.equal(previousWalking(records,'2026-10-01').walkingMinutes,0);
assert.equal(previousWalking(records,'2026-09-27').walkingMinutes,15);
assert.equal(previousWalking(records,'2026-08-31'),undefined);
assert.deepEqual(walkingRecords([entry('2026-10-01',2.5),entry('2026-10-01',-1),entry('2026-10-01',1441)],'2026-10-01'),[]);
assert.deepEqual(walkingRecords([],'2026-10-01'),[]);
assert.equal(records[0].day,'2026-10-01');
// Adding walking minutes keeps older rows intact and initially unrecorded.
const db=new DatabaseSync(':memory:');
const migrations=fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort();
for(const file of migrations.filter(f=>!f.startsWith('0002_')))db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
db.prepare('INSERT INTO entries(user_id,day,weight,mood,done,note) VALUES(?,?,?,?,?,?)').run('old-user','2026-09-29',60,0,'["h0"]','保存したメモ');
db.exec(fs.readFileSync('drizzle/0002_walking_minutes.sql','utf8'));
assert.deepEqual({...db.prepare('SELECT weight,mood,done,note,walking_minutes FROM entries').get()},{weight:60,mood:0,done:'["h0"]',note:'保存したメモ',walking_minutes:null});
db.close();
console.log('PASS: walking chronology, zero versus skipped days, historical comparisons, date windows, invalid durations and migration preservation.');
