import { normalizeSettings, today, type Entry, type Settings, type State } from './mochi';
import { updateSchema, entrySchema, settingsSchema, isRecordableDay, starActions, mergeSettings, lockedReward } from './state-rules';
import { z } from 'zod';
import { rememberDeviceEpoch, assertDeviceWriteAllowed, rotateDeviceEpoch, acknowledgeFailedDeviceChange } from './device-storage-guard';
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
 rememberDeviceEpoch();if(body!==undefined)assertDeviceWriteAllowed();
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
 try{const serialized=JSON.stringify(saved);assertDeviceWriteAllowed();localStorage.setItem(KEY,serialized)}catch{throw new Error('この端末に保存できませんでした。入力は残っています。空き容量を確認して、もう一度お試しください。')}
 // Ask once to keep the records when the browser clears storage under pressure.
 if(!persistRequested){persistRequested=true;void navigator.storage?.persist?.().catch(()=>{})}
 return view(saved);
}
/** The same JSON as /api/export on Sites, built from this device's records. */
export function exportDeviceRecords(){const saved=read();return new File([JSON.stringify({format:'mochi-days-export',version:1,exportedAt:new Date().toISOString(),...view(saved),starLedger:saved.stars},null,2)],`mochi-days-${today()}.json`,{type:'application/json'});}

// Only this app's Pages keys: never clear the origin or a sibling app's namespace.
function auxiliaryKeys(){
 const keys:string[]=[];
 for(let index=0;index<localStorage.length;index++){
  const key=localStorage.key(index);
  if(key==='mochi-days:timer:v1:device'||key&&(/^mochi-days:draft:v1:device:\d{4}-\d{2}-\d{2}:(daily|weight|walking|note)$/.test(key)||/^mochi-days:walking-record-timer:v1:device:\d{4}-\d{2}-\d{2}$/.test(key)))keys.push(key);
 }
 return keys;
}
function removeAuxiliaryKeys(){
 let complete=true;
 for(const key of auxiliaryKeys())try{localStorage.removeItem(key);if(localStorage.getItem(key)!==null)complete=false}catch{complete=false}
 return complete;
}
export function deviceRecordsSnapshot(){rememberDeviceEpoch();return localStorage.getItem(KEY);}
export function deleteDeviceRecords(expected:string|null){
 assertDeviceWriteAllowed();
 if(localStorage.getItem(KEY)!==expected)throw new Error('別の画面で記録が変わりました。開き直して確認してください。');
 const epoch=rotateDeviceEpoch();
 try{
  if(!removeAuxiliaryKeys())throw new Error('一部の下書きを消せませんでした。記録は削除していません。ブラウザの保存設定を確認してください。');
  try{localStorage.removeItem(KEY);if(localStorage.getItem(KEY)!==null)throw new Error()}catch{throw new Error('記録を削除できませんでした。ブラウザの保存設定を確認してください。')}
 }catch(error){if(localStorage.getItem(KEY)===expected)acknowledgeFailedDeviceChange(epoch);throw error}
}

export const MAX_BACKUP_BYTES=25*1024*1024;
const invalidBackup=()=>new Error('このアプリの有効なバックアップを選んでください。今の記録は変更していません。');
const backupSchema=z.object({format:z.literal('mochi-days-export'),version:z.literal(1),exportedAt:z.string().datetime({offset:true}),settings:z.record(z.unknown()),entries:z.array(z.record(z.unknown())).max(10000),stars:z.number().int().min(0).max(50000),starLedger:z.array(z.string().max(40)).max(50000).optional(),companion:z.unknown().optional()}).strict();
function parseBackup(text:string):Saved{
 if(new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)throw invalidBackup();
 try{
  const raw:unknown=JSON.parse(text);
  // Reject prototype keys and excessively nested unknown metadata before schema traversal.
  const stack:{value:unknown;depth:number}[]=[{value:raw,depth:0}];let nodes=0;
  while(stack.length){const {value,depth}=stack.pop()!;if(++nodes>1000000||depth>40)throw invalidBackup();if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw invalidBackup();stack.push({value:child,depth:depth+1})}}
  const data=backupSchema.parse(raw),days=new Set<string>();
  if(Object.hasOwn(data.settings,'kind'))throw invalidBackup();
  const entries=data.entries.map(value=>{const {kind,...entry}=entrySchema.parse({kind:'entry',...value});if(!isRecordableDay(entry.day)||days.has(entry.day))throw invalidBackup();days.add(entry.day);return entry});
  const legacySettings={...data.settings};delete legacySettings.walkingGoalMinutes;
  const {kind,...validatedSettings}=settingsSchema.parse({...normalizeSettings(null),...legacySettings,onboardingComplete:legacySettings.onboardingComplete??true,kind:'settings'});
  const settings=normalizeSettings(validatedSettings,entries.length>0);
  const earned=[...new Set(entries.flatMap(entry=>starActions(entry).map(action=>`${entry.day}:${action}`)))];
  let stars=data.starLedger;
  if(stars){
   const ledgerIds=new Set(stars);
   if(stars.length!==data.stars||ledgerIds.size!==stars.length||stars.some(key=>!(/^legacy-credit:\d{1,5}$/.test(key)||/^\d{4}-\d{2}-\d{2}:(weight|mood|h[012])$/.test(key)&&isRecordableDay(key.slice(0,10))))||earned.some(key=>!ledgerIds.has(key)))throw invalidBackup();
  }else{
   // Old exports retained the balance but not historical cleared-entry star IDs.
   if(data.stars<earned.length)throw invalidBackup();
   stars=[...earned,...Array.from({length:data.stars-earned.length},(_,index)=>`legacy-credit:${index}`)];
  }
  if(lockedReward(settings,stars.length))throw invalidBackup();
  const companion=normalizeCompanion(data.companion,{settings,entries,stars:stars.length,day:today()});
  return {profile:settings,entries,stars,companion};
 }catch{throw invalidBackup()}
}
export function inspectDeviceBackup(text:string){const saved=parseBackup(text);return {name:saved.profile!.name,days:saved.entries.length,stars:saved.stars.length};}
export function restoreDeviceRecords(text:string,expected:string|null){
 assertDeviceWriteAllowed();
 const saved=parseBackup(text),serialized=JSON.stringify(saved);
 if(localStorage.getItem(KEY)!==expected)throw new Error('別の画面で記録が変わりました。ファイルを選び直して確認してください。');
 // One atomic replacement: malformed input and quota failures cannot erase existing records.
 const epoch=rotateDeviceEpoch();
 try{localStorage.setItem(KEY,serialized)}catch{if(localStorage.getItem(KEY)===expected)acknowledgeFailedDeviceChange(epoch);throw new Error('復元できませんでした。今の記録は変更していません。空き容量と保存設定を確認してください。')}
 // Cross-key cleanup is not atomic. Report a partial result instead of claiming total success.
 let draftsCleared=false;try{draftsCleared=removeAuxiliaryKeys()}catch{}
 return {draftsCleared};
}
