'use client';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Gift, Flower2, Leaf, Moon, Home, Footprints, ChevronLeft, ChevronRight, Check, Sun, Waves, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pet } from './pet';
import { ComfortActivities, ActivityTimer } from './comfort-activities';
import { RoomEditor } from './room-editor';
import { CompanionGifts } from './companion-gifts';
import type { State } from '@/lib/mochi';
import { routes, seasonStories } from '@/lib/companion-content';
import { walkingJourney, type CompanionState, type CompanionAction, type Interaction } from '@/lib/companion';

export type HubPage='journey'|'rest'|'room'|'gifts';
const pages=[['journey','おさんぽ',Footprints],['rest','休む・遊ぶ',Moon],['room','模様がえ',Home],['gifts','贈りもの',Gift]] as const;
const titles:Record<HubPage,string>={journey:'おさんぽの物語',rest:'もちと、ひと休み',room:'お部屋を模様がえ',gifts:'もちからの贈りもの'};
type CompanionTabsProps={page:HubPage;onPageChange:(page:HubPage)=>void;state:State;companion:CompanionState;day:string;hour:number;scope:string;disabled:boolean;onCommand:(command:CompanionAction)=>Promise<boolean>;onInteract:(kind:Interaction)=>void;onWalking:(minutes:number)=>void;onStretch:()=>void};

export function CompanionTabs(props:CompanionTabsProps){
 const {page,onPageChange,state,companion,day,hour,disabled,onCommand}=props;
 const [visited,setVisited]=useState<HubPage[]>([page]),[episode,setEpisode]=useState<string|null>(null);
 const panels=useRef<Record<string,HTMLDivElement|null>>({});
 const ready=companion.gifts.filter(item=>item.species===state.settings.species&&!item.opened&&item.available).length;
 useEffect(()=>{setVisited(previous=>previous.includes(page)?previous:[...previous,page])},[page]);
 useEffect(()=>setEpisode(null),[day,state.settings.species]);
 function choose(next:string){onPageChange(next as HubPage);requestAnimationFrame(()=>panels.current[next]?.scrollIntoView({block:'start',behavior:'auto'}))}
 return <Tabs value={page} onValueChange={choose} className="companion-activities collection-browser focused-hub">
  <div className="section-heading companion-tabs-heading"><h2>もちとの時間</h2></div>
  <TabsList className="collection-tabs companion-sections" aria-label="もちとの時間">{pages.map(([id,label,Icon])=><TabsTrigger key={id} value={id} aria-label={label}><Icon size={20}/><span>{label}</span>{id==='gifts'&&ready>0&&<span className="companion-tab-badge" aria-label={ready+'この贈りものが届いています'}>{ready>9?'9+':ready}</span>}</TabsTrigger>)}</TabsList>
  {pages.map(([id,,Icon])=><TabsContent key={id} ref={element=>{panels.current[id]=element}} value={id} forceMount hidden={page!==id}>{(visited.includes(id)||page===id)&&<section className={'companion-activity-panel focused-'+id} aria-label={titles[id]}><h3 className="companion-activity-title"><Icon size={19}/>{titles[id]}</h3>
   {id==='journey'&&<JourneyPage {...props} selectedEpisode={episode}/>}
   {id==='rest'&&<div className="hub-content"><ComfortActivities active={page==='rest'} species={state.settings.species} outfit={state.settings.outfit} preferences={companion.preferences} onPreference={patch=>onCommand({action:'preference',patch})} onInteract={props.onInteract}/></div>}
   {id==='room'&&<RoomEditor companion={companion} species={state.settings.species} outfit={state.settings.outfit} hour={hour} disabled={disabled} onCommand={onCommand}/>}
   {id==='gifts'&&<CompanionGifts state={state} companion={companion} hour={hour} disabled={disabled} onCommand={onCommand} onRoom={()=>choose('room')} onEpisode={id=>{setEpisode(id);choose('journey')}}/>}
  </section>}</TabsContent>)}
 </Tabs>;
}
function Landscape({route}:{route:'forest'|'town'|'sea'}){const Icon=route==='forest'?TreePine:route==='town'?Home:Waves;return <span className={'landscape landscape-'+route} aria-hidden="true"><Sun size={18}/><Icon size={36}/><Icon size={25}/></span>;}
function JourneyPage({state,companion,scope,onWalking,onStretch,disabled,onCommand,selectedEpisode}:CompanionTabsProps&{selectedEpisode:string|null}){
 const [selected,setSelected]=useState(selectedEpisode),[mapPage,setMapPage]=useState(0);
 useEffect(()=>setSelected(selectedEpisode),[selectedEpisode,state.settings.species]);
 const episodes=companion.journey.episodes.filter(item=>item.species===state.settings.species),episode=episodes.find(item=>item.id===selected)??episodes.at(-1),total=walkingJourney(state.entries),lastMap=Math.floor(total/180),visible=Math.min(mapPage,lastMap);
 return <div className="hub-content journey-content"><div className="route-postcards">{routes.map(([id,label])=><button type="button" key={id} disabled={disabled} aria-pressed={companion.journey.route===id} onClick={()=>void onCommand({action:'route',route:id})}><Landscape route={id}/><strong>{label}</strong>{companion.journey.route===id&&<Check size={15} className="tile-check"/>}</button>)}</div>
  <section className="journey-progress"><div className="journey-total"><Footprints size={20}/><strong>{total}<small>分のおさんぽ</small></strong></div><div className={'journey-map route-'+companion.journey.route}>{Array.from({length:7},(_,index)=>{const threshold=visible*180+index*30;return <div className={'map-stop '+(total>=threshold?'reached':'')} key={index}><span>{total>=threshold?<Check size={20}/>:index%2?<Flower2 size={20}/>:<Leaf size={20}/>}</span><small>{threshold}分</small></div>})}</div><span className="map-next">次の景色まで {30-total%30}分</span><div className="map-pagination"><Button type="button" variant="ghost" disabled={visible===0} onClick={()=>setMapPage(visible-1)}><ChevronLeft size={16}/>前</Button><Button type="button" variant="ghost" disabled={visible>=lastMap} onClick={()=>setMapPage(visible+1)}>次<ChevronRight size={16}/></Button></div></section>
  {episode?<article className="storybook"><div className="storybook-picture"><Landscape route={episode.route}/><Pet species={episode.species} outfit={state.settings.outfit} pose={episode.resting?2:0}/></div><span className="episode-npc">{episode.npc}</span><h3>{episode.title}</h3><p>{episode.text}</p><div className="story-choices">{episode.choices.map((value,index)=><button type="button" key={value} disabled={disabled} aria-pressed={episode.answer===index} onClick={()=>void onCommand({action:'story',id:episode.id,choice:index})}>{episode.answer===index?<Check size={18}/>:<Footprints size={18}/>}<strong>{value}</strong><ChevronRight size={17}/></button>)}</div><div className="story-souvenir"><Gift size={17}/>{episode.souvenir}</div></article>:<div className="story-empty"><Pet species={state.settings.species} small/><BookOpen size={31}/><span>記録を残した日に、お話が届くよ</span></div>}
  <details className="hub-secondary"><summary><Footprints size={18}/>歩く時間をはかる</summary><ActivityTimer scope={scope} onWalking={onWalking} onStretch={onStretch}/></details>
  <details className="hub-secondary"><summary><BookOpen size={18}/>これまでの物語</summary>{episodes.slice().reverse().map(item=><Button type="button" variant="outline" key={item.id} onClick={()=>setSelected(item.id)}>{item.day.slice(5).replace('-','/')} · {item.title}</Button>)}</details>
  <details className="hub-secondary"><summary><Flower2 size={18}/>季節のお話</summary>{seasonStories.map(([id,title,text])=><details key={id}><summary>{title}</summary><p>{text}</p></details>)}</details>
 </div>;
}
