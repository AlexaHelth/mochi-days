import { daysAgo, type Entry } from './mochi';

export function hasRecord(entry:Entry){return entry.weight!==null||entry.walkingMinutes!=null||entry.mood!==null||entry.done.length>0||!!entry.note?.trim();}
export function recentEntries(entries:Entry[],day:string,days=30){
 const start=daysAgo(day,days-1);
 return entries.filter(entry=>entry.day>=start&&entry.day<=day&&hasRecord(entry)).sort((a,b)=>b.day.localeCompare(a.day));
}
