export type Entry = {day:string;weight:number|null;mood:number|null;done:string[]};
export type Settings = {name:string;habits:string[];showWeight:boolean;room:string};
export type State = {entries:Entry[];settings:Settings;stars:number};
export const defaults:Settings={name:'もち',habits:['少し歩く','からだを伸ばす','ゆっくり食べる'],showWeight:true,room:'cream'};
export const rooms=[{id:'cream',name:'ひだまりのお部屋',cost:0,color:'#fff8ee'},{id:'peach',name:'もものお部屋',cost:10,color:'#ffe4db'},{id:'sky',name:'青空のお部屋',cost:25,color:'#e5f1fa'},{id:'flower',name:'お花のお部屋',cost:50,color:'#f6e6f0'}];
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());}
export function daysAgo(day:string,n:number){const d=new Date(day+'T12:00:00+09:00');d.setUTCDate(d.getUTCDate()-n);return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(d);}
