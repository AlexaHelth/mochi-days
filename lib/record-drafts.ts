import { entrySchema } from './state-rules';
import type { Entry } from './mochi';
export type RecordMode='daily'|'weight'|'walking'|'note';
export type RecordDraft={entry:Entry;weight:string;weightIncluded:boolean;walkingMinutes:string;walkingIncluded:boolean;letter:boolean;at:number};
export function draftKey(scope:string,day:string,mode:RecordMode){return 'mochi-days:draft:v1:'+encodeURIComponent(scope)+':'+day+':'+mode;}
export function readDraft(scope:string,day:string,mode:RecordMode):RecordDraft|null{
 try{
  const raw=JSON.parse(localStorage.getItem(draftKey(scope,day,mode))??'null');
  if(!raw||!entrySchema.safeParse({kind:'entry',...raw.entry}).success||raw.entry.day!==day||typeof raw.weight!=='string'||raw.weight.length>30||typeof raw.walkingMinutes!=='string'||raw.walkingMinutes.length>30||typeof raw.weightIncluded!=='boolean'||typeof raw.walkingIncluded!=='boolean'||typeof raw.at!=='number')return null;
  return {...raw,letter:raw.letter===true};
 }catch{return null;}
}
export function writeDraft(scope:string,day:string,mode:RecordMode,draft:RecordDraft){try{localStorage.setItem(draftKey(scope,day,mode),JSON.stringify(draft));return true}catch{return false}}
export function clearDraft(scope:string,day:string,mode:RecordMode){try{localStorage.removeItem(draftKey(scope,day,mode))}catch{}}
