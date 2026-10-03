import { z } from 'zod';
import { outfits, speciesIds, outfitIds, daysAgo, type Entry, type Settings, type Species } from './mochi';
import { memoryQuestions, journeyScene, restStories, routes, seasonStories, feelings, dayTags } from './companion-content';

export const interactionKinds=['pet','hug','brush','snack','toy','breathing','puzzle','hide','rhythm','garden','costume'] as const;
export type Interaction=typeof interactionKinds[number];
export const daySchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const roomSchema=z.object({floor:z.enum(['wood','rug','meadow']).default('wood'),furniture:z.enum(['cushion','bed','book','ball']).default('cushion'),weather:z.enum(['sun','rain','snow']).default('sun'),light:z.enum(['auto','morning','evening','night']).default('auto'),season:z.enum(['plain','spring','summer','autumn','winter']).default('plain'),palette:z.enum(['warm','leaf','sky','clear']).default('warm'),keepsakeId:z.string().max(100).nullable().optional()});
export type RoomDesign=z.infer<typeof roomSchema>;
export const preferenceSchema=z.object({callingName:z.string().trim().max(12).default(''),tone:z.enum(['quiet','gentle','bright']).default('gentle'),support:z.enum(['listen','rest','cheer']).default('listen'),ambient:z.enum(['off','rain','sea','forest']).default('off'),volume:z.number().min(0).max(.5).default(.15),haptics:z.boolean().default(false),voice:z.boolean().default(false),music:z.boolean().default(false),melody:z.enum(['tea','moon','garden']).default('tea'),room:roomSchema.default({}),favorites:z.array(z.object({name:z.string().trim().min(1).max(20),design:roomSchema})).max(4).default([]),wishlist:z.enum(outfitIds).nullable().default(null)});
export type CompanionPreferences=z.infer<typeof preferenceSchema>;
const profileSchema=z.object({met:daySchema,name:z.string().max(12),personality:z.enum(['calm','shy','curious']).default('calm'),likes:z.record(z.string().max(20),z.string().max(40)).default({}),visits:z.array(daySchema).max(10000).default([]),interactions:z.record(daySchema,z.array(z.enum(interactionKinds)).max(11)).default({}),talks:z.record(daySchema,z.object({key:z.string().max(20),value:z.string().max(40)})).default({}),discoveries:z.array(z.object({day:daySchema,text:z.string().max(100)})).max(10000).default([]),lettersRead:z.array(z.string().max(30)).max(300).default([])});
export type CompanionProfile=z.infer<typeof profileSchema>;
const giftSchema=z.object({id:z.string().max(100),label:z.string().max(60),note:z.string().max(200),day:daySchema,species:z.enum(speciesIds),available:z.boolean(),opened:z.boolean(),episodeId:z.string().optional()});
const episodeSchema=z.object({id:z.string().max(100),day:daySchema,species:z.enum(speciesIds),route:z.enum(['forest','town','sea']),title:z.string().max(60),text:z.string().max(600),npc:z.string().max(30),choices:z.array(z.string().max(80)).length(2),answer:z.number().int().min(0).max(1).nullable(),souvenir:z.string().max(60),resting:z.boolean()});
export type JourneyEpisode=z.infer<typeof episodeSchema>;
const receiptSchema=z.object({day:daySchema,source:z.string().max(80),seen:z.boolean()});
const stateSchema=z.object({version:z.literal(1),pets:z.record(z.enum(speciesIds),profileSchema).default({}),preferences:preferenceSchema.default({}),daily:z.record(daySchema,z.object({selfWords:z.string().max(160).default(''),tomorrow:z.string().max(80).default(''),step:z.string().max(100).default('')})).default({}),gifts:z.array(giftSchema).max(20000).default([]),journey:z.object({route:z.enum(['forest','town','sea']).default('forest'),recordedDays:z.array(daySchema).max(10000).default([]),episodes:z.array(episodeSchema).max(10000).default([])}).default({}),receipts:z.record(z.string().max(40),receiptSchema).default({})});
export type CompanionState=z.infer<typeof stateSchema>;
export type CompanionContext={day:string;settings:Settings;entries:Entry[];stars:number;source?:string};
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('visit')}).strict(),
 z.object({action:z.literal('interact'),interaction:z.enum(interactionKinds)}).strict(),
 z.object({action:z.literal('personality'),value:z.enum(['calm','shy','curious'])}).strict(),
 z.object({action:z.literal('preference'),patch:preferenceSchema.partial().strict()}).strict(),
 z.object({action:z.literal('like'),key:z.enum(['fruit','season','activity','color','weather','flower']),value:z.string().trim().min(1).max(40)}).strict(),
 z.object({action:z.literal('talk'),choice:z.number().int().min(0).max(1)}).strict(),
 z.object({action:z.literal('step')}).strict(),
 z.object({action:z.literal('route'),route:z.enum(['forest','town','sea'])}).strict(),
 z.object({action:z.literal('story'),id:z.string().max(100),choice:z.number().int().min(0).max(1)}).strict(),
 z.object({action:z.literal('openGift'),id:z.string().max(100)}).strict(),
 z.object({action:z.literal('seasonGift'),season:z.enum(['spring','summer','autumn','winter'])}).strict(),
 z.object({action:z.literal('bedtime'),selfWords:z.string().trim().max(160),tomorrow:z.string().trim().max(80)}).strict(),
 z.object({action:z.literal('readLetter'),id:z.string().max(30)}).strict(),
 z.object({action:z.literal('receipt'),id:z.enum(outfitIds)}).strict(),
 z.object({action:z.literal('roomFavorite'),name:z.string().trim().min(1).max(20)}).strict(),
 z.object({action:z.literal('removeFavorite'),index:z.number().int().min(0).max(3)}).strict(),
]);
// A bounded action is accepted; clients cannot replace a whole memory archive or forge stars.
export const companionUpdateSchema=z.object({kind:z.literal('companion'),command:actionSchema}).strict();
export type CompanionAction={action:'step'}|{action:'visit'}|{action:'interact';interaction:Interaction}|{action:'personality';value:CompanionProfile['personality']}|{action:'preference';patch:Partial<CompanionPreferences>}|{action:'like';key:'fruit'|'season'|'activity'|'color'|'weather'|'flower';value:string}|{action:'talk';choice:number}|{action:'route';route:CompanionState['journey']['route']}|{action:'story';id:string;choice:number}|{action:'openGift';id:string}|{action:'seasonGift';season:string}|{action:'bedtime';selfWords:string;tomorrow:string}|{action:'readLetter';id:string}|{action:'receipt';id:string}|{action:'roomFavorite';name:string}|{action:'removeFavorite';index:number};
export const entryExtras={partial:z.array(z.enum(['h0','h1','h2'])).max(3).optional(),feelings:z.array(z.enum(feelings)).max(3).optional(),tags:z.array(z.enum(dayTags)).max(3).optional()};
export function meaningful(entry:Entry){return entry.weight!==null||entry.walkingMinutes!=null||entry.mood!==null||entry.done.length>0||!!entry.note?.trim()||!!entry.partial?.length||!!entry.feelings?.length||!!entry.tags?.length||entry.care?.resting===true;}
export function newCompanion(ctx:CompanionContext):CompanionState{
 const state=stateSchema.parse({version:1});
 state.journey.recordedDays=ctx.entries.filter(entry=>entry.day<ctx.day&&meaningful(entry)).map(entry=>entry.day);
 for(const outfit of outfits)if(outfit.id!=='none'&&outfit.cost<=ctx.stars)state.receipts[outfit.id]={day:ctx.day,source:'これまでのあしあとから',seen:true};
 return state;
}
export function normalizeCompanion(raw:unknown,ctx:CompanionContext):CompanionState{
 if(raw==null)return newCompanion(ctx);
 const parsed=stateSchema.safeParse(raw);
 if(!parsed.success)throw new Error('もちの思い出を読み込めませんでした。保存していたデータは変更していません。');
 return parsed.data;
}
function activeProfile(state:CompanionState,ctx:CompanionContext){
 const species=ctx.settings.species;
 const pet=state.pets[species]??{met:ctx.day,name:ctx.settings.name,personality:'calm',likes:{},visits:[],interactions:{},talks:{},discoveries:[],lettersRead:[]};
 pet.name=ctx.settings.name;state.pets[species]=pet;return pet;
}
function gift(state:CompanionState,item:z.infer<typeof giftSchema>){if(!state.gifts.some(previous=>previous.id===item.id))state.gifts.push(item);}
export function dailyQuestion(day:string){const index=Math.abs(Math.floor(Date.parse(day)/86400000))%memoryQuestions.length;return memoryQuestions[index];}
export function syncCompanion(previous:CompanionState,ctx:CompanionContext):CompanionState{
 const state=structuredClone(previous);if(!ctx.settings.onboardingComplete)return state;
 const pet=activeProfile(state,ctx),entry=ctx.entries.find(entry=>entry.day===ctx.day);
 if(entry&&meaningful(entry)){
  gift(state,{id:'daily:'+ctx.day,label:'今日の小さなお花',note:'どの記録でも、自分を気にかけた日に。数字の大小は関係ないよ。',day:ctx.day,species:ctx.settings.species,available:true,opened:false});
  if(!state.journey.recordedDays.includes(ctx.day)){
   const route=state.journey.route,index=state.journey.episodes.filter(episode=>episode.route===route&&!episode.resting).length;
   const scene=journeyScene(route,index),rest=restStories[state.journey.episodes.length%restStories.length],last=state.journey.episodes.at(-1);
   const remembered=last?.answer!=null?`前に選んだ「${last.choices[last.answer]}」を思い出しながら、` :'';
   const liked=pet.likes.season?`「${pet.likes.season}」も好きだったね。` :'';
   const episode:JourneyEpisode={id:`story:${ctx.day}:${ctx.settings.species}`,day:ctx.day,species:ctx.settings.species,route,title:entry.care?.resting?rest[0]:scene.title,text:(entry.care?.resting?rest[1]:remembered+scene.text)+liked,npc:entry.care?.resting?'お部屋のもち':routes.find(item=>item[0]===route)![2],choices:entry.care?.resting?[rest[3],rest[4]]:scene.choices,answer:null,souvenir:entry.care?.resting?rest[2]:scene.souvenir,resting:!!entry.care?.resting};
   state.journey.episodes.push(episode);state.journey.recordedDays.push(ctx.day);
   gift(state,{id:'souvenir:'+episode.id,label:episode.souvenir,note:episode.title+'で見つけた、小さなおみやげ。',day:ctx.day,species:ctx.settings.species,available:false,opened:false,episodeId:episode.id});
   pet.discoveries.push({day:ctx.day,text:episode.title+'の思い出が増えたよ。'});
  }
 }
 const source=ctx.source??'まいにちの小さな記録から';
 for(const outfit of outfits)if(outfit.id!=='none'&&outfit.cost<=ctx.stars&&!state.receipts[outfit.id])state.receipts[outfit.id]={day:ctx.day,source,seen:false};
 return state;
}
export function applyCompanionAction(previous:CompanionState,command:CompanionAction,ctx:CompanionContext):CompanionState{
 const parsed=companionUpdateSchema.safeParse({kind:'companion',command});if(!parsed.success)throw new Error('もちとの過ごし方を確認してください。');
 const state=syncCompanion(previous,ctx),pet=activeProfile(state,ctx),species=ctx.settings.species;
 switch(command.action){
 case 'visit':
  if(!pet.visits.includes(ctx.day))pet.visits.push(ctx.day);
  for(const item of state.gifts)item.available=true;
  break;
 case 'interact':{
  const actions=pet.interactions[ctx.day]??[];
  if(!actions.includes(command.interaction)){actions.push(command.interaction);pet.interactions[ctx.day]=actions;pet.discoveries.push({day:ctx.day,text:interactionLabel(command.interaction)+'を一緒に楽しんだ日。'});}
  gift(state,{id:'welcome:'+species,label:'はじめましての一輪',note:'会ってくれて、ありがとう。もちから最初の小さな贈りもの。',day:ctx.day,species,available:true,opened:false});
  break;
 }
 case 'personality':pet.personality=command.value;break;
 case 'preference':{const displayed=command.patch.room?.keepsakeId;if(displayed&&!state.gifts.some(item=>item.id===displayed&&item.opened))throw new Error('受け取った贈りものを選んでください。');state.preferences=preferenceSchema.parse({...state.preferences,...command.patch,...(command.patch.room?{room:{...state.preferences.room,...command.patch.room}}:{})});break;}
 case 'like':pet.likes[command.key]=command.value;break;
 case 'talk':{
  const question=dailyQuestion(ctx.day),value=question.options[command.choice];
  pet.talks[ctx.day]={key:question.key,value};pet.likes[question.key]=value;break;
 }
 case 'route':state.journey.route=command.route;break;
 case 'story':{const episode=state.journey.episodes.find(item=>item.id===command.id);if(!episode)throw new Error('このお話はまだありません。');episode.answer=command.choice;break;}
 case 'openGift':{const item=state.gifts.find(item=>item.id===command.id);if(!item||!item.available)throw new Error('次に会ったときに、ゆっくり受け取ろう。');item.opened=true;break;}
 case 'seasonGift':{
  const season=seasonStories.find(item=>item[0]===command.season)!;
  gift(state,{id:'season:'+command.season+':'+species,label:season[3],note:season[2],day:ctx.day,species,available:true,opened:true});break;
 }
 case 'step':state.daily[ctx.day]={...(state.daily[ctx.day]??{selfWords:'',tomorrow:'',step:''}),step:goalStep(ctx.settings.goal)};break;
 case 'bedtime':state.daily[ctx.day]={...(state.daily[ctx.day]??{selfWords:'',tomorrow:'',step:''}),selfWords:command.selfWords,tomorrow:command.tomorrow};break;
 case 'readLetter':if(!pet.lettersRead.includes(command.id))pet.lettersRead.push(command.id);break;
 case 'receipt':if(state.receipts[command.id])state.receipts[command.id].seen=true;else throw new Error('この贈りものはまだひらいていません。');break;
 case 'roomFavorite':{
  const favorite={name:command.name,design:structuredClone(state.preferences.room)},index=state.preferences.favorites.findIndex(item=>item.name===command.name);
  if(index>=0)state.preferences.favorites[index]=favorite;
  else if(state.preferences.favorites.length<4)state.preferences.favorites.push(favorite);
  else throw new Error('お気に入りは4つまで。ひとつ外してから保存してね。');break;
 }
 case 'removeFavorite':state.preferences.favorites.splice(command.index,1);break;
 }
 return stateSchema.parse(state);
}
export function interactionLabel(kind:Interaction){return ({pet:'なでなで',hug:'ぎゅっとする時間',brush:'ブラシ',snack:'おやつ',toy:'ボール遊び',breathing:'ひと呼吸',puzzle:'絵合わせ',hide:'かくれんぼ',rhythm:'おててのリズム',garden:'小さな庭',costume:'おめかしのしぐさ'})[kind];}
export function bondCount(pet?:CompanionProfile){return pet?Object.values(pet.interactions).reduce((sum,actions)=>sum+actions.length,0):0;}
export function bondLevel(pet?:CompanionProfile){const count=bondCount(pet);return count>=30?3:count>=12?2:count>=4?1:0;}
export function plantStage(pet?:CompanionProfile){return Math.min(4,Math.floor(Object.keys(pet?.interactions??{}).length/3));}
export function anniversary(met:string,day:string){
 const start=new Date(met+'T12:00:00Z'),current=new Date(day+'T12:00:00Z'),months=(current.getUTCFullYear()-start.getUTCFullYear())*12+current.getUTCMonth()-start.getUTCMonth();
 const last=new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+1,0)).getUTCDate();
 return months>0&&current.getUTCDate()===Math.min(start.getUTCDate(),last)?months:null;
}
export function lettersFor(pet:CompanionProfile,day:string,weeklyDays:number|null){
 const letters:Array<{id:string;title:string;text:string}>=[];
 for(const threshold of [7,30])if(pet.visits.length>=threshold)letters.push({id:'thanks-'+threshold,title:`${threshold}日、会えたきみへ`,text:`${threshold}日分、会いに来てくれてありがとう。おやすみがあっても、一緒に過ごした時間はずっと残っているよ。これからも、きみのペースで会おうね。`});
 const months=anniversary(pet.met,day);if(months)letters.push({id:'anniversary-'+day,title:`出会って${months%12===0?months/12+'年':months+'か月'}の小さなお祝い`,text:'はじめましての日から、また一緒に過ごせる今日へ。小さなケーキを分けっこして、これからものんびりよろしくね。'});
 for(const id of pet.lettersRead.filter(id=>id.startsWith('anniversary-')&&!letters.some(letter=>letter.id===id)))letters.push({id,title:'出会った日の、小さなお祝い',text:'小さなケーキを分けっこした日のこと、覚えているよ。会わない日も、一緒に過ごした思い出は消えないよ。'});
 const start=daysAgo(day,((new Date(day+'T12:00:00Z').getUTCDay()+6)%7));
 if(weeklyDays&&pet.visits.filter(date=>date>=start&&date<=day).length>=weeklyDays)letters.push({id:'week-'+start,title:'今週、きみのペースで会えたね',text:'選んだペースで、もちに会えた一週間。ひとつずつの時間を大切に、今日は小さなお茶のお祝いをしよう。'});
 return letters;
}
export function dailyGreeting(pet:CompanionProfile|undefined,prefs:CompanionPreferences,mood:number|null,fallback:string){
 const calling=prefs.callingName?prefs.callingName+'、':'';
 const memory=pet?.likes.season?'前に選んだ「'+pet.likes.season+'」、覚えているよ。':'';
 if(mood===2||prefs.support==='rest')return calling+'今日は静かに、そばにいるよ。何もしない時間も一緒に。';
 if(mood===0&&prefs.tone!=='quiet')return calling+'今日は、少し遊んでみる？ きみのペースで、一緒に。'+memory;
 if(prefs.tone==='quiet')return calling+'おかえり。ここで、ひと息。'+memory;
 if(prefs.support==='cheer'||prefs.tone==='bright')return calling+'会えてうれしいな。小さな一歩も、一緒に喜ぼう。'+memory;
 return calling+(memory||fallback);
}
export function recordReply(before:Entry|undefined,after:Entry){
 if(before?.walkingMinutes!==after.walkingMinutes&&after.walkingMinutes!=null)return 'おかえり。歩いた時間を残せたね。いっしょに足を休めよう。';
 if(before?.note!==after.note&&after.note?.trim())return '聞かせてくれて、ありがとう。きみの言葉を、ここに大切に残したよ。';
 if(before?.weight!==after.weight&&after.weight!==null)return '今日の体重を残せたね。数字を確かめる時間、おつかれさま。';
 if(after.partial?.length)return '少しできた時間も、ちゃんと残ったよ。今日はそれだけでも大丈夫。';
 if(after.mood===2)return '今の気分を教えてくれて、ありがとう。静かに、そばにいるね。';
 return 'ひとつ残せたね。自分を気にかける時間を、ありがとう。';
}
export function rewardSource(before:Entry|undefined,after:Entry){
 if(after.done.some(id=>!before?.done.includes(id)))return '小さな習慣に取り組んだ日';
 if(after.mood!=null&&after.mood!==before?.mood)return '気分を残した日';
 if(after.weight!=null&&after.weight!==before?.weight)return '体重を残した日';
 if(after.note?.trim()&&after.note!==before?.note)return 'メモを残した日';
 if(after.walkingMinutes!=null&&after.walkingMinutes!==before?.walkingMinutes)return 'おさんぽの時間を残した日';
 return 'まいにちの小さな記録から';
}
export function goalStep(goal:string){return /歩|さんぽ/.test(goal)?'外の空気を、1分だけ感じてみる':/食|ダイエット|産後/.test(goal)?'今日の一食を、ひと口だけゆっくり味わう':/伸|座/.test(goal)?'気が向いたら、肩をひとつゆっくり動かす':'自分のために、30秒だけひと息つく';}
export function walkingJourney(entries:Entry[]){return entries.reduce((sum,entry)=>sum+(entry.walkingMinutes??0),0);}
