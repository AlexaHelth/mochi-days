import { daysAgo, type CareDay, type Entry } from './mochi';

export function careFor(entry?:Pick<Entry,'care'>):Required<CareDay>{
 const care=entry?.care;
 return {visited:care?.visited===true,resting:care?.resting===true,light:care?.light===true,quiet:care?.quiet===true,finished:care?.finished===true};
}
export function mergeCare(previous:CareDay|undefined,patch:CareDay):CareDay{
 return {...careFor({care:previous}),...patch,visited:previous?.visited===true||patch.visited===true};
}
export function visitDays(entries:Entry[]){return entries.filter(entry=>entry.care?.visited===true).map(entry=>entry.day);}
export function calendarWeek(day:string){
 const weekday=new Date(day+'T12:00:00+09:00').getUTCDay(),start=daysAgo(day,(weekday+6)%7);
 return Array.from({length:7},(_,index)=>daysAgo(start,-index));
}
export type WelcomeKind='first'|'return'|'today'|'familiar';
export function welcomeKind(entries:Entry[],day:string):WelcomeKind{
 if(entries.some(entry=>entry.day===day&&entry.care?.visited))return 'today';
 const previous=entries.filter(entry=>entry.day<day&&(entry.care?.visited||entry.care?.resting||entry.weight!==null||entry.walkingMinutes!=null||entry.mood!==null||entry.done.length||entry.note?.trim())).map(entry=>entry.day).sort().at(-1);
 if(!previous)return 'first';
 return previous<=daysAgo(day,3)?'return':'familiar';
}
export function welcomeText(kind:WelcomeKind,hour:number){
 if(kind==='return')return 'おかえり。また会えてうれしいな。ここまでのあしあとも、ちゃんと残っているよ。';
 if(kind==='first')return '会いに来てくれて、うれしいな。まずは、のんびり一緒に過ごそう。';
 if(kind==='today')return 'また会えたね。何もしない時間も、一緒に過ごそう。';
 return hour>=21||hour<6?'おかえり。今日もおつかれさま。ゆっくり一緒に休もう。':hour<11?'おはよう。ひと息ついて、きみのペースで始めよう。':'おかえり。きょうも会えてうれしいな。';
}
export function smallerGoals(goal:string){
 if(/歩|さんぽ|ウォーキング/.test(goal))return ['できる日に、1分だけのおさんぽ','週のどこかで、少し外の空気に触れる','休む日も大切に、気が向いたときに歩く'];
 if(/食|ダイエット|体|産後/.test(goal))return ['できる日に、一食をゆっくり味わう','休息を大切に、無理なく自分をいたわる','今日はひとつ、自分にやさしいことをする'];
 return ['できる日に、ひとつだけ自分を気にかける','週のどこかで、自分のためにひと息つく','休むことも含めて、自分のペースで過ごす'];
}
