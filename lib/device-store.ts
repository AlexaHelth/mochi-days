import { normalizeSettings, today, type Entry, type Settings, type State } from './mochi';
import { updateSchema, isRecordableDay, starActions, mergeSettings, lockedReward } from './state-rules';
import { mergeCare } from './care';
import { habitNamesFor } from './habits';
import { normalizeCompanion, syncCompanion, applyCompanionAction, rewardSource, type CompanionState, type CompanionAction } from './companion';
/** GitHub Pages build: the same contract as requestState, but records stay in this browser. No account, server or network. */
// Every Pages site of the account shares one origin (alexahelth.github.io), so the key names the app.
const KEY='mochi-days:v1';
type Saved={profile:Settings|null;entries:Entry[];stars:string[];companion?:CompanionState};
let persistRequested=false;
function read():Saved{const saved=JSON.parse(localStorage.getItem(KEY)??'{}')??{};return {profile:saved.profile??null,entries:Array.isArray(saved.entries)?saved.entries:[],stars:Array.isArray(saved.stars)?saved.stars:[],companion:saved.companion};}
function view(saved:Saved):State{const context={entries:[...saved.entries].sort((a,b)=>a.day<b.day?1:-1),settings:normalizeSettings(saved.profile,saved.entries.length>0),stars:saved.stars.length};return {...context,companion:normalizeCompanion(saved.companion,{...context,day:today()})};}
export async function requestDeviceState(body?:unknown):Promise<State>{
 let saved:Saved;
 try{saved=read()}catch{throw new Error('この端末の記録を読み込めませんでした。ブラウザでWebサイトのデータ保存が許可されているか確認してください。')}
 if(body===undefined)return view(saved);
 const previousCompanion=view(saved).companion!,previousEntries=saved.entries;
 const parsed=updateSchema.safeParse(body);
 if(!parsed.success)throw new Error('入力内容を確認してください。体重は1〜500kg、名前は12文字以内です。');
 const d=parsed.data;
 if(d.kind==='entry'){
  if(!isRecordableDay(d.day))throw new Error('今日以前の日付を選んでください。');
  const previous=saved.entries.find(e=>e.day===d.day);
  saved={...saved,entries:[...saved.entries.filter(e=>e.day!==d.day),{day:d.day,weight:d.weight,walkingMinutes:d.walkingMinutes===undefined?previous?.walkingMinutes??null:d.walkingMinutes,mood:d.mood,done:d.done,note:d.note??previous?.note??'',partial:(d.partial??previous?.partial??[]).filter(h=>!d.done.includes(h as 'h0'|'h1'|'h2')),feelings:d.feelings??previous?.feelings??[],tags:d.tags??previous?.tags??[],...((previous?.habitNames??d.habitNames)?{habitNames:previous?.habitNames??d.habitNames}:{}),...(previous?.care?{care:previous.care}:{})}],stars:[...new Set([...saved.stars,...starActions(d).map(a=>`${d.day}:${a}`)])]};
 }else if(d.kind==='daily-habits'){
  if(!isRecordableDay(d.day))throw new Error('今日以前の日付を選んでください。');
  const previous=saved.entries.find(entry=>entry.day===d.day)??{day:d.day,weight:null,walkingMinutes:null,mood:null,done:[],note:''};
  saved={...saved,entries:[...saved.entries.filter(entry=>entry.day!==d.day),{...previous,habitNames:habitNamesFor(previous,view(saved).settings.habits)}]};
 }else if(d.kind==='care'){
  if(!isRecordableDay(d.day)||d.visited&&d.day!==today())throw new Error('会えた日は今日の日付で残します。');
  const previous=saved.entries.find(entry=>entry.day===d.day)??{day:d.day,weight:null,walkingMinutes:null,mood:null,done:[],note:''};
  const {kind,day,...patch}=d;
  saved={...saved,entries:[...saved.entries.filter(entry=>entry.day!==day),{...previous,care:mergeCare(previous.care,patch)}]};
 }else if(d.kind==='settings'){
  const settings=mergeSettings(normalizeSettings(saved.profile),d);
  const locked=lockedReward(settings,saved.stars.length);if(locked)throw new Error(locked);
  saved={...saved,profile:settings};
 }
 const context={...view(saved),day:today(),source:d.kind==='entry'?rewardSource(previousEntries.find(entry=>entry.day===d.day),d):undefined};
 saved={...saved,companion:d.kind==='companion'?applyCompanionAction(previousCompanion,d.command as CompanionAction,context):syncCompanion(previousCompanion,context)};
 try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{throw new Error('この端末に保存できませんでした。入力は残っています。空き容量を確認して、もう一度お試しください。')}
 // Ask once to keep the records when the browser clears storage under pressure.
 if(!persistRequested){persistRequested=true;void navigator.storage?.persist?.().catch(()=>{})}
 return view(saved);
}
/** The same JSON as /api/export on Sites, built from this device's records. */
export function exportDeviceRecords(){return new File([JSON.stringify({format:'mochi-days-export',version:1,exportedAt:new Date().toISOString(),...view(read())},null,2)],`mochi-days-${today()}.json`,{type:'application/json'});}
