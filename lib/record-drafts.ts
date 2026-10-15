import { entrySchema } from './state-rules';
import type { Entry } from './mochi';
import { rememberDeviceEpoch, deviceStorageWritable } from './device-storage-guard';
export type RecordMode='daily'|'weight'|'walking'|'note';
export type RecordDraft={entry:Entry;weight:string;weightIncluded:boolean;walkingMinutes:string;walkingIncluded:boolean;letter:boolean;at:number};
export const DRAFT_MAX_AGE_MS=7*24*60*60*1000;
function expired(at:unknown,now:number){return typeof at!=='number'||!Number.isFinite(at)||at<now-DRAFT_MAX_AGE_MS||at>now+5*60*1000;}
export function draftKey(scope:string,day:string,mode:RecordMode){return 'mochi-days:draft:v1:'+encodeURIComponent(scope)+':'+day+':'+mode;}
export function readDraft(scope:string,day:string,mode:RecordMode,now=Date.now()):RecordDraft|null{
 try{
  if(scope==='device')rememberDeviceEpoch();
  const raw=JSON.parse(localStorage.getItem(draftKey(scope,day,mode))??'null');
  if(!raw)return null;
  if(expired(raw.at,now)){clearDraft(scope,day,mode);return null;}
  const parsed=entrySchema.safeParse({kind:'entry',...raw.entry});
  if(!parsed.success||raw.entry.day!==day||typeof raw.weight!=='string'||raw.weight.length>30||typeof raw.walkingMinutes!=='string'||raw.walkingMinutes.length>30||typeof raw.weightIncluded!=='boolean'||typeof raw.walkingIncluded!=='boolean')return null;
  const {kind,...entry}=parsed.data;
  return {...raw,entry,letter:raw.letter===true};
 }catch{return null;}
}
export function writeDraft(scope:string,day:string,mode:RecordMode,draft:RecordDraft){try{if(scope==='device'&&!deviceStorageWritable())return false;localStorage.setItem(draftKey(scope,day,mode),JSON.stringify(draft));return true}catch{return false}}
export function clearDraft(scope:string,day:string,mode:RecordMode){try{if(scope==='device'&&!deviceStorageWritable())return;localStorage.removeItem(draftKey(scope,day,mode))}catch{}}
export function pruneDrafts(scope:string,now=Date.now()){
 try{
  if(scope==='device'&&!deviceStorageWritable())return;
  const prefix='mochi-days:draft:v1:'+encodeURIComponent(scope)+':',keys:string[]=[];
  for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith(prefix)&&/^\d{4}-\d{2}-\d{2}:(daily|weight|walking|note)$/.test(key.slice(prefix.length)))keys.push(key)}
  for(const key of keys){let remove=false;try{const draft=JSON.parse(localStorage.getItem(key)??'null');remove=!draft||expired(draft.at,now)}catch{remove=true}if(remove)try{localStorage.removeItem(key)}catch{}}
 }catch{}
}
