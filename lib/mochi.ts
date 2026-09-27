export type Entry = {day:string;weight:number|null;mood:number|null;done:string[];note?:string};
import { speciesIds, outfitIds, type Species, type Outfit } from '../packages/mochi-assets/index.js';
export { speciesIds, outfitIds, pets, expressionNames, petSprite, type Species, type Outfit } from '../packages/mochi-assets/index.js';
export const outfits: {id:Outfit;name:string;cost:number;note:string}[] = [
 {id:'none',name:'いつものすがた',cost:0,note:'ふわふわ、そのまま。'},
 {id:'bandana',name:'おさんぽバンダナ',cost:5,note:'小さな一歩のおともに。'},
 {id:'ribbon',name:'ももいろリボン',cost:12,note:'今日に、ちょっとおめかし。'},
 {id:'crown',name:'ちいさな王冠',cost:20,note:'あなたの「できた」に拍手。'},
 {id:'cape',name:'おほしさまマント',cost:30,note:'いつもの一日を冒険に。'},
 {id:'flower',name:'お花のかんむり',cost:40,note:'ゆっくり、花ひらく。'},
 {id:'nightcap',name:'おやすみぼうし',cost:55,note:'休むことも、大切な習慣。'},
 {id:'pumpkin',name:'かぼちゃの衣装',cost:70,note:'まあるい秋のおたのしみ。'},
 {id:'santa',name:'サンタのおめかし',cost:90,note:'積み重ねた日々に贈りもの。'},
];
export type Settings = {name:string;habits:string[];showWeight:boolean;room:string;species:Species;outfit:Outfit;onboardingComplete:boolean};
export type State = {entries:Entry[];settings:Settings;stars:number};
export const defaults:Settings={name:'もち',habits:['少し歩く','からだを伸ばす','ゆっくり食べる'],showWeight:true,room:'cream',species:'dog',outfit:'none',onboardingComplete:false};
export const rooms=[{id:'cream',name:'ひだまりのお部屋',cost:0,color:'#fff8ee'},{id:'peach',name:'もものお部屋',cost:10,color:'#ffe4db'},{id:'sky',name:'青空のお部屋',cost:25,color:'#e5f1fa'},{id:'flower',name:'お花のお部屋',cost:50,color:'#f6e6f0'}];
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());}
export function daysAgo(day:string,n:number){const d=new Date(day+'T12:00:00+09:00');d.setUTCDate(d.getUTCDate()-n);return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(d);}

// Old profiles and people with existing records keep their original puppy and progress.
export function normalizeSettings(raw:Partial<Settings>|null,hasEntries=false):Settings {
 return {...defaults,...raw,
  species:speciesIds.includes(raw?.species as Species)?raw!.species!:'dog',
  outfit:outfitIds.includes(raw?.outfit as Outfit)?raw!.outfit!:'none',
  onboardingComplete:raw?.onboardingComplete??(raw!==null||hasEntries)};
}
