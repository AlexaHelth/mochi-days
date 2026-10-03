'use client';
import { useEffect, useState } from 'react';
import { BookOpen, Heart, Gift, Flower2, Leaf, Moon, MessageCircle, Home, Footprints, ChevronLeft, ChevronRight, Check, Mail, Settings, Sun, Waves, TreePine, CloudRain, CircleHelp, Ear } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Pet } from './pet';
import { ComfortActivities, ActivityTimer } from './comfort-activities';
import { RoomEditor } from './room-editor';
import { CompanionGifts } from './companion-gifts';
import { pets, daysAgo, type State, type Species } from '@/lib/mochi';
import { personalities, tones, supports, memoryQuestions, routes, seasonStories } from '@/lib/companion-content';
import { bondCount, lettersFor, dailyQuestion, goalStep, walkingJourney, type CompanionState, type CompanionAction, type Interaction } from '@/lib/companion';

export type HubPage='profile'|'talk'|'journey'|'rest'|'room'|'gifts';
const pages=[['profile','もちのこと',Heart],['talk','お話',MessageCircle],['journey','おさんぽ',Footprints],['rest','ひと休み',Moon],['room','模様がえ',Home],['gifts','贈りもの',Gift]] as const;
const actions:Record<HubPage,{title:string;description:string}>={
 profile:{title:'もちのこと・思い出',description:'性格や好きなもの、お手紙を見る'},
 talk:{title:'もちとお話しする',description:'今日のお話や、やさしい言葉を選ぶ'},
 journey:{title:'おさんぽの物語',description:'歩いた記録で物語を進める・タイマーも'},
 rest:{title:'ひと休み・小さな遊び',description:'深呼吸やミニゲーム、好きな音で休む'},
 room:{title:'お部屋を模様がえ',description:'家具・天気・色を好みに変える'},
 gifts:{title:'もちからの贈りもの',description:'お手紙や思い出の品を受け取る'},
};
export function CompanionGateway({onOpen,ready,quiet}:{onOpen:(page:HubPage)=>void;ready:number;quiet:boolean}){
 return <section className="card companion-gateway"><div className="section-heading"><h2>もちとの時間</h2><span className="subtle">好きなときに</span></div><div className="gateway-choices">{pages.map(([id,,Icon])=><button type="button" key={id} onClick={()=>onOpen(id)} aria-label={actions[id].title+'を開く'}><span className={'gateway-icon gateway-'+id}><Icon size={23}/></span><span className="gateway-copy"><strong>{actions[id].title}</strong><small>{actions[id].description}</small></span><ChevronRight size={18}/>{id==='gifts'&&ready>0&&<span className="gift-dot" aria-label="受け取れる贈りもの"/>}</button>)}</div>{!quiet&&<p className="support-copy">お話も、遊びも。気になるところから。</p>}</section>;
}
type HubProps={open:boolean;onOpenChange:(open:boolean)=>void;initialPage:HubPage;state:State;companion:CompanionState;day:string;hour:number;scope:string;disabled:boolean;onCommand:(command:CompanionAction)=>Promise<boolean>;onInteract:(kind:Interaction)=>void;onWalking:(minutes:number)=>void;onStretch:()=>void;onNote:()=>void;onSwitch:(species:Species)=>Promise<boolean>;onBedtime:(selfWords:string,tomorrow:string)=>Promise<boolean>};
export function CompanionHub(props:HubProps){
 const {open,onOpenChange,initialPage,state,companion,day,hour,disabled,onCommand}=props;
 const [page,setPage]=useState(initialPage),[episode,setEpisode]=useState<string|null>(null);
 useEffect(()=>{if(open){setPage(initialPage);setEpisode(null)}},[open,initialPage,day]);
 const Icon=pages.find(item=>item[0]===page)![2];
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={'app-dialog companion-hub focused-hub focused-'+page}>
  <DialogTitle><Icon size={22}/>{actions[page].title}</DialogTitle><DialogDescription className="sr-only">{actions[page].description}</DialogDescription>
  {open&&<>
   {page==='profile'&&<ProfilePage {...props} onGifts={()=>setPage('gifts')}/>}
   {page==='talk'&&<TalkPage {...props}/>}
   {page==='journey'&&<JourneyPage {...props} selectedEpisode={episode}/>}
   {page==='rest'&&<div className="hub-content"><ComfortActivities species={state.settings.species} outfit={state.settings.outfit} preferences={companion.preferences} onPreference={patch=>onCommand({action:'preference',patch})} onInteract={props.onInteract}/></div>}
   {page==='room'&&<RoomEditor companion={companion} species={state.settings.species} outfit={state.settings.outfit} hour={hour} disabled={disabled} onCommand={onCommand}/>}
   {page==='gifts'&&<CompanionGifts state={state} companion={companion} hour={hour} disabled={disabled} onCommand={onCommand} onRoom={()=>setPage('room')} onEpisode={id=>{setEpisode(id);setPage('journey')}}/>}
  </>}
 </DialogContent></Dialog>;
}
function ProfilePage({state,companion,day,disabled,onCommand,onSwitch,onGifts}:HubProps&{onGifts:()=>void}){
 const [species,setSpecies]=useState(state.settings.species),[letter,setLetter]=useState<{title:string;text:string}|null>(null),[all,setAll]=useState(false);
 const pet=companion.pets[species],current=species===state.settings.species,prefs=companion.preferences;
 const letters=pet?lettersFor(pet,day,state.settings.weeklyDays):[];
 return <div className="hub-content profile-content">
  <section className="pet-passport"><Pet species={species} outfit={current?state.settings.outfit:'none'} pose={1}/><div><h3>{pet?.name??pets.find(item=>item.id===species)?.name}</h3><span className="pet-personality">{personalities.find(item=>item[0]===pet?.personality)?.[1]??'はじめまして'}</span><div className="passport-stats"><span><Heart size={17}/><strong>{pet?bondCount(pet):0}</strong><small>ふれあい</small></span><span><Footprints size={17}/><strong>{pet?.visits.length??0}</strong><small>会えた日</small></span></div>{pet&&<time>{pet.met.replaceAll('-',' / ')}に出会ったよ</time>}</div></section>
  {!current&&<Button type="button" disabled={disabled} onClick={()=>void onSwitch(species)}>この子に会う</Button>}
  {pet&&<>
   <div className="profile-likes">{memoryQuestions.map(item=><span key={item.key}><MemoryArt kind={item.key} value={pet.likes[item.key]??''}/><small>{{fruit:'果物',season:'季節',activity:'過ごし方',color:'色',weather:'音',flower:'花'}[item.key]}</small><strong>{pet.likes[item.key]||'これから'}</strong></span>)}</div>
   {letter?<article className="mochi-letter"><Mail size={32}/><h3>{letter.title}</h3><p>{letter.text}</p><Button type="button" variant="ghost" onClick={()=>setLetter(null)}>お手紙を閉じる</Button></article>:<section className="letter-collection"><h3><Mail size={18}/>もちのお手紙</h3>{letters.length?letters.map(item=><button type="button" disabled={disabled} key={item.id} onClick={()=>{setLetter(item);if(current)void onCommand({action:'readLetter',id:item.id})}}><Mail size={27}/><strong>{item.title}</strong>{pet.lettersRead.includes(item.id)&&<Check size={15}/>}</button>):<div className="empty-envelope"><Mail size={32}/><span>お手紙が届くのを、のんびり待とう</span></div>}</section>}
   <section className="memory-album"><h3><BookOpen size={18}/>思い出アルバム</h3><div className="memory-cards">{pet.discoveries.length?pet.discoveries.slice().reverse().slice(0,all?undefined:4).map((item,index)=><article key={item.day+index}><span className="memory-stamp">{index%2?<Leaf size={24}/>:<Heart size={24}/>}</span><time>{item.day.slice(5).replace('-','/')}</time><p>{item.text}</p></article>):<div className="album-empty"><Heart size={30}/><span>これからの思い出</span></div>}</div>{pet.discoveries.length>4&&<Button type="button" variant="ghost" onClick={()=>setAll(!all)}>{all?'最近の思い出':'思い出をすべて見る'}</Button>}<Button type="button" variant="outline" onClick={onGifts}><Gift size={18}/>宝もの棚を見る</Button></section>
   <details className="hub-secondary"><summary><Settings size={18}/>この子の好み・呼び名</summary><div className="choice-row">{personalities.map(([id,label])=><Button type="button" key={id} disabled={disabled||!current} aria-pressed={pet.personality===id} variant={pet.personality===id?'secondary':'outline'} onClick={()=>void onCommand({action:'personality',value:id})}>{label}</Button>)}</div><div className="likes-grid">{memoryQuestions.map(item=><label key={item.key}>{item.question}<select value={pet.likes[item.key]??''} disabled={disabled||!current} onChange={event=>void onCommand({action:'like',key:item.key,value:event.target.value})}><option value="" disabled>これから</option>{item.options.map(value=><option key={value}>{value}</option>)}</select></label>)}</div><label>呼ばれたい名前<input aria-label="呼ばれたい名前" maxLength={12} defaultValue={prefs.callingName} key={prefs.callingName} disabled={disabled} onBlur={event=>{if(event.target.value.trim()!==prefs.callingName)void onCommand({action:'preference',patch:{callingName:event.target.value.trim()}})}}/></label><label>言葉の温度<select value={prefs.tone} disabled={disabled} onChange={event=>void onCommand({action:'preference',patch:{tone:event.target.value as typeof prefs.tone}})}>{tones.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></details>
  </>}
  <details className="hub-secondary"><summary>3匹のアルバム</summary><div className="profile-species">{pets.map(item=><button type="button" key={item.id} aria-pressed={species===item.id} onClick={()=>{setSpecies(item.id);setLetter(null)}}><Pet species={item.id} small/><strong>{item.name}</strong></button>)}</div></details>
 </div>;
}
function MemoryArt({kind,value}:{kind:string;value:string}){
 if(!value)return <span className="memory-art" aria-hidden="true"><CircleHelp size={26}/></span>;
 if(kind==='fruit')return <span className="memory-fruit" aria-hidden="true">{value==='りんご'?'🍎':'🍓'}</span>;
 const Icon=kind==='season'?(value==='秋の葉っぱ'?Leaf:Flower2):kind==='activity'?(value==='ひなたぼっこ'?Sun:BookOpen):kind==='weather'?(value==='波のゆらゆら'?Waves:CloudRain):kind==='flower'?Flower2:Heart;
 return <span className={'memory-art memory-'+kind+(value==='葉っぱの緑'?' green':value==='黄色い花'?' yellow':value==='白い花'?' white':'')} aria-hidden="true"><Icon size={28}/></span>;
}
function TalkPage({state,companion,day,disabled,onCommand,onNote,onOpenChange,onBedtime}:HubProps){
 const prefs=companion.preferences,pet=companion.pets[state.settings.species],question=dailyQuestion(day),talk=pet?.talks[day];
 const [selfWords,setSelfWords]=useState(companion.daily[day]?.selfWords??''),[tomorrow,setTomorrow]=useState(companion.daily[day]?.tomorrow??'');
 return <div className="hub-content talk-content"><div className="conversation-scene"><Pet species={state.settings.species} outfit={state.settings.outfit} pose={talk?1:0}/><div className="conversation-bubble">{question.question}</div></div>
  <div className="talk-answer-choices">{question.options.map((value,index)=><button type="button" key={value} disabled={disabled} aria-pressed={talk?.value===value} onClick={()=>void onCommand({action:'talk',choice:index})}><MemoryArt kind={question.key} value={value}/><strong>{value}</strong>{talk?.value===value&&<Check size={17} className="tile-check"/>}</button>)}</div>
  {talk&&<div className="conversation-answer" role="status"><Check size={16}/>{talk.value}<span>もちが覚えているよ</span></div>}
  <div className="support-tiles">{supports.map(([id,label])=>{const Icon=id==='listen'?Ear:id==='rest'?Moon:Heart;return <button type="button" key={id} disabled={disabled} aria-pressed={prefs.support===id} onClick={()=>void onCommand({action:'preference',patch:{support:id}})}><Icon size={24}/><span>{label}</span></button>})}</div>
  <button type="button" className="write-to-mochi" onClick={()=>{onOpenChange(false);onNote()}}><Mail size={24}/><strong>もちにひとこと書く</strong><ChevronRight size={18}/></button>
  <details className="hub-secondary"><summary><Footprints size={18}/>今日の小さな一歩</summary><p>{state.settings.goal||'自分のペースで過ごす'}</p><strong>{goalStep(state.settings.goal)}</strong><Button type="button" disabled={disabled||!!companion.daily[day]?.step} onClick={()=>void onCommand({action:'step'})}>{companion.daily[day]?.step?'選んだ一歩':'今日の一歩に選ぶ'}</Button></details>
  <details className="hub-secondary"><summary><Moon size={18}/>おやすみのお話</summary><label>今日の自分へ<input aria-label="今日の自分へひとこと" value={selfWords} maxLength={160} onChange={event=>setSelfWords(event.target.value)}/></label><div className="choice-row">{['今日も、おつかれさま','休めた自分にも、ありがとう','少しできた、それで十分'].map(text=><Button type="button" variant="outline" key={text} onClick={()=>setSelfWords(text)}>{text}</Button>)}</div><label>明日の小さな楽しみ<input aria-label="明日の小さな楽しみ" value={tomorrow} maxLength={80} onChange={event=>setTomorrow(event.target.value)}/></label><div className="choice-row">{['明日はもちとお茶','明日は好きな絵本をひらく','明日は窓辺でひと息'].map(text=><Button type="button" variant="outline" key={text} onClick={()=>setTomorrow(text)}>{text}</Button>)}</div><Button type="button" disabled={disabled} onClick={async()=>{if(await onBedtime(selfWords,tomorrow))onOpenChange(false)}}><Moon size={17}/>もちと、おやすみ</Button></details>
  {companion.daily[daysAgo(day,1)]?.tomorrow&&<div className="yesterday-note"><Sun size={17}/>{companion.daily[daysAgo(day,1)].tomorrow}</div>}
 </div>;
}
function Landscape({route}:{route:'forest'|'town'|'sea'}){const Icon=route==='forest'?TreePine:route==='town'?Home:Waves;return <span className={'landscape landscape-'+route} aria-hidden="true"><Sun size={18}/><Icon size={36}/><Icon size={25}/></span>;}
function JourneyPage({state,companion,scope,onOpenChange,onWalking,onStretch,disabled,onCommand,selectedEpisode}:HubProps&{selectedEpisode:string|null}){
 const [selected,setSelected]=useState(selectedEpisode),[mapPage,setMapPage]=useState(0);
 const episodes=companion.journey.episodes.filter(item=>item.species===state.settings.species),episode=episodes.find(item=>item.id===selected)??episodes.at(-1),total=walkingJourney(state.entries),lastMap=Math.floor(total/180),visible=Math.min(mapPage,lastMap);
 return <div className="hub-content journey-content"><div className="route-postcards">{routes.map(([id,label])=><button type="button" key={id} disabled={disabled} aria-pressed={companion.journey.route===id} onClick={()=>void onCommand({action:'route',route:id})}><Landscape route={id}/><strong>{label}</strong>{companion.journey.route===id&&<Check size={15} className="tile-check"/>}</button>)}</div>
  <section className="journey-progress"><div className="journey-total"><Footprints size={20}/><strong>{total}<small>分のおさんぽ</small></strong></div><div className={'journey-map route-'+companion.journey.route}>{Array.from({length:7},(_,index)=>{const threshold=visible*180+index*30;return <div className={'map-stop '+(total>=threshold?'reached':'')} key={index}><span>{total>=threshold?<Check size={20}/>:index%2?<Flower2 size={20}/>:<Leaf size={20}/>}</span><small>{threshold}分</small></div>})}</div><span className="map-next">次の景色まで {30-total%30}分</span><div className="map-pagination"><Button type="button" variant="ghost" disabled={visible===0} onClick={()=>setMapPage(visible-1)}><ChevronLeft size={16}/>前</Button><Button type="button" variant="ghost" disabled={visible>=lastMap} onClick={()=>setMapPage(visible+1)}>次<ChevronRight size={16}/></Button></div></section>
  {episode?<article className="storybook"><div className="storybook-picture"><Landscape route={episode.route}/><Pet species={episode.species} outfit={state.settings.outfit} pose={episode.resting?2:0}/></div><span className="episode-npc">{episode.npc}</span><h3>{episode.title}</h3><p>{episode.text}</p><div className="story-choices">{episode.choices.map((value,index)=><button type="button" key={value} disabled={disabled} aria-pressed={episode.answer===index} onClick={()=>void onCommand({action:'story',id:episode.id,choice:index})}>{episode.answer===index?<Check size={18}/>:<Footprints size={18}/>}<strong>{value}</strong><ChevronRight size={17}/></button>)}</div><div className="story-souvenir"><Gift size={17}/>{episode.souvenir}</div></article>:<div className="story-empty"><Pet species={state.settings.species} small/><BookOpen size={31}/><span>記録を残した日に、お話が届くよ</span></div>}
  <details className="hub-secondary"><summary><Footprints size={18}/>歩く時間をはかる</summary><ActivityTimer scope={scope} onWalking={minutes=>{onOpenChange(false);onWalking(minutes)}} onStretch={()=>{onOpenChange(false);onStretch()}}/></details>
  <details className="hub-secondary"><summary><BookOpen size={18}/>これまでの物語</summary>{episodes.slice().reverse().map(item=><Button type="button" variant="outline" key={item.id} onClick={()=>setSelected(item.id)}>{item.day.slice(5).replace('-','/')} · {item.title}</Button>)}</details>
  <details className="hub-secondary"><summary><Flower2 size={18}/>季節のお話</summary>{seasonStories.map(([id,title,text])=><details key={id}><summary>{title}</summary><p>{text}</p></details>)}</details>
 </div>;
}
