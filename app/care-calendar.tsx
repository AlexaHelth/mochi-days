import { Moon, PawPrint } from 'lucide-react';
import type { Entry } from '@/lib/mochi';
import { hasRecord } from '@/lib/history';

export function CareCalendar({entries,days,today}:{entries:Entry[];days:string[];today:string}){
 return <div className="week-days care-week-days" aria-label="今週のあしあと">{days.map(day=>{
  const entry=entries.find(entry=>entry.day===day),resting=entry?.care?.resting,recorded=entry&&hasRecord(entry),visited=entry?.care?.visited,future=day>today;
  const state=resting?'休んだ日':recorded?'記録した日':visited?'会えた日':future?'これからの日':'余白の日';
  return <div className={'week-day '+(day===today?'current ':'')+(future?'future':'')} key={day} aria-label={`${day.replaceAll('-','/')} ${state}`}><span>{new Date(day+'T12:00:00+09:00').toLocaleDateString('ja-JP',{weekday:'short',timeZone:'Asia/Tokyo'})}</span><span className={'stamp '+(resting?'rest-stamp':recorded?'filled':visited?'visit-stamp':'')}>{resting?<Moon size={17}/>:recorded?<PawPrint size={18}/>:visited?<span className="visit-dot"/>:<span>·</span>}</span></div>;
 })}</div>;
}
