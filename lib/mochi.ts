export type Entry = {day:string;weight:number|null;walkingMinutes?:number|null;mood:number|null;done:string[];note?:string};
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
 {id:'bee',name:'みつばちのおさんぽ',cost:105,note:'小さな羽で、今日の一歩。'},
 {id:'butterfly',name:'ちょうちょの羽',cost:120,note:'ひらひら、気持ちも軽く。'},
 {id:'strawberry',name:'いちごのおめかし',cost:135,note:'甘いごほうび、ひとつどうぞ。'},
 {id:'lemon',name:'れもんのひだまり',cost:150,note:'すっきりした朝のおとも。'},
 {id:'cherry',name:'さくらんぼリボン',cost:165,note:'ふたつ並んで、にこにこ。'},
 {id:'sunflower',name:'ひまわりのつなぎ',cost:180,note:'おひさまみたいに、あたたかく。'},
 {id:'hydrangea',name:'あじさいのケープ',cost:195,note:'雨の日にも、やさしい色。'},
 {id:'mushroom',name:'きのこの森のもち',cost:210,note:'森を歩く、小さな相棒。'},
 {id:'chef',name:'もちのコックさん',cost:225,note:'今日はなにを作ろうかな。'},
 {id:'baker',name:'ふわふわパン屋さん',cost:240,note:'焼きたての、しあわせを。'},
 {id:'painter',name:'小さな絵描きさん',cost:255,note:'まいにちに、好きな色を。'},
 {id:'detective',name:'もちの名探偵',cost:270,note:'小さな「できた」を見つけたよ。'},
 {id:'sailor',name:'おふねの船員さん',cost:285,note:'ゆっくり、次の港へ。'},
 {id:'raincoat',name:'雨の日レインコート',cost:300,note:'ぽつぽつ雨も、一緒に。'},
 {id:'winter',name:'あったか冬じたく',cost:315,note:'ほっと、ぬくぬくしよう。'},
 {id:'pajamas',name:'おやすみパジャマ',cost:330,note:'休む時間も、たからもの。'},
 {id:'astronaut',name:'もちの宇宙旅行',cost:345,note:'小さな一歩が、遠くまで。'},
 {id:'wizard',name:'おほしさまの魔法使い',cost:360,note:'今日に、やさしい魔法を。'},
 {id:'fairy',name:'森のようせい',cost:375,note:'きみのペースを、見守るよ。'},
 {id:'dragon',name:'ちびドラゴン',cost:390,note:'勇気は、ほんのひとさじ。'},
 {id:'angel',name:'やさしい天使',cost:405,note:'どんな日も、そばにいるよ。'},
 {id:'ocean',name:'海のきらめき',cost:420,note:'波のように、ゆったりと。'},
 {id:'festival',name:'もちの夏まつり',cost:435,note:'小さな「できた」に、お祝いを。'},
 {id:'birthday',name:'もちのパーティー',cost:450,note:'ここまでのまいにちに、ありがとう。'},
 {id:'starlight',name:'ほしぞらの特別なもち',cost:450,note:'全部ひらいた、あなたにだけ。'},
];
export type Settings = {name:string;habits:string[];showWeight:boolean;room:string;species:Species;outfit:Outfit;onboardingComplete:boolean;goal:string};
export type State = {entries:Entry[];settings:Settings;stars:number};
export const defaults:Settings={name:'もち',habits:['少し歩く','からだを伸ばす','ゆっくり食べる'],showWeight:true,room:'cream',species:'dog',outfit:'none',onboardingComplete:false,goal:''};
export const rooms=[{id:'cream',name:'ひだまりのお部屋',cost:0,color:'#fff8ee'},{id:'peach',name:'もものお部屋',cost:10,color:'#ffe4db'},{id:'sky',name:'青空のお部屋',cost:25,color:'#e5f1fa'},{id:'flower',name:'お花のお部屋',cost:50,color:'#f6e6f0'}];
export const regularOutfits=outfits.filter(o=>o.id!=='none'&&o.id!=='starlight');
export const allRewardsCost=Math.max(...regularOutfits.map(o=>o.cost),...rooms.map(r=>r.cost));
export function allRewardsUnlocked(stars:number){return Number.isFinite(stars)&&regularOutfits.every(o=>stars>=o.cost)&&rooms.every(r=>stars>=r.cost);}
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());}
export function daysAgo(day:string,n:number){const d=new Date(day+'T12:00:00+09:00');d.setUTCDate(d.getUTCDate()-n);return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(d);}

// Old profiles and people with existing records keep their original puppy and progress.
export function normalizeSettings(raw:Partial<Settings>|null,hasEntries=false):Settings {
 return {...defaults,...raw,
  goal:typeof raw?.goal==='string'?raw.goal.trim().slice(0,80):'',
  species:speciesIds.includes(raw?.species as Species)?raw!.species!:'dog',
  outfit:outfitIds.includes(raw?.outfit as Outfit)?raw!.outfit!:'none',
  onboardingComplete:raw?.onboardingComplete??(raw!==null||hasEntries)};
}
