'use client';
import { useRef, useState } from 'react';
import { Gift, Check, Home, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pet } from './pet';
import { KeepsakeArt } from './keepsake-art';
import { RoomPreview } from './room-editor';
import { pets, allRewardsUnlocked, type State, type Species } from '@/lib/mochi';
import { seasonStories, afterStories } from '@/lib/companion-content';
import type { CompanionState, CompanionAction } from '@/lib/companion';

export function CompanionGifts({state,companion,hour,disabled,onCommand,onRoom,onEpisode}:{state:State;companion:CompanionState;hour:number;disabled:boolean;onCommand:(command:CompanionAction)=>Promise<boolean>;onRoom:()=>void;onEpisode:(id:string)=>void}){
 const [species,setSpecies]=useState<Species>(state.settings.species),[selected,setSelected]=useState<string|null>(null),[all,setAll]=useState(false);
 const content=useRef<HTMLDivElement>(null);
 const gifts=companion.gifts.filter(item=>item.species===species),received=gifts.filter(item=>item.opened),waiting=gifts.filter(item=>!item.opened).reverse(),item=gifts.find(item=>item.id===selected),displayed=companion.preferences.room.keepsakeId;
 function selectGift(id:string){setSelected(id);requestAnimationFrame(()=>content.current?.scrollIntoView({block:'start',behavior:'auto'}));}
 async function open(id:string){if(await onCommand({action:'openGift',id}))selectGift(id);}
 return <div className="hub-content gift-content" ref={content}>
  {item?.opened&&<section className="gift-reveal" key={item.id} aria-label="受け取った贈りもの"><div className="gift-handover"><Pet species={species} outfit={species===state.settings.species?state.settings.outfit:'none'} pose={3} small/><KeepsakeArt label={item.label}/></div><h3>{item.label}</h3><span className="gift-saved"><Check size={16}/>宝もの棚に追加</span>
   <div className="gift-use-actions"><Button type="button" disabled={disabled||displayed===item.id} onClick={()=>void onCommand({action:'preference',patch:{room:{...companion.preferences.room,keepsakeId:item.id}}})}><Home size={17}/>{displayed===item.id?'お部屋に飾り中':'お部屋に飾る'}</Button><Button type="button" variant="ghost" onClick={()=>setSelected(null)}>棚に戻る</Button></div>
   {displayed===item.id&&<button type="button" className="gift-room-preview" onClick={onRoom} aria-label="贈りものを飾ったお部屋を見る"><RoomPreview species={state.settings.species} outfit={state.settings.outfit} design={companion.preferences.room} hour={hour} keepsake={item}/><span>お部屋を見る<ChevronRight size={17}/></span></button>}
   <details className="gift-origin"><summary>この品の思い出</summary><time>{item.day.replaceAll('-',' / ')}</time><p>{item.note}</p>{item.episodeId&&<Button type="button" variant="outline" onClick={()=>onEpisode(item.episodeId!)}><BookOpen size={16}/>このときのお話</Button>}</details>
  </section>}
  {!item&&waiting.length>0&&<section className="gift-inbox"><h3><Gift size={20}/>届いた包み <span>{waiting.length}</span></h3><div className="gift-package-grid">{waiting.slice(0,all?undefined:6).map(gift=><button type="button" key={gift.id} className="gift-package" disabled={disabled||!gift.available} aria-label={'贈りもの「'+gift.label+'」をひらく'} onClick={()=>void open(gift.id)}><span className="gift-box-art"><Gift size={43}/></span><strong>{gift.label}</strong><span>{gift.available?'ひらく':'次に会ったときに'}</span></button>)}</div>{waiting.length>6&&!all&&<Button type="button" variant="ghost" onClick={()=>setAll(true)}>ほかの包みを見る</Button>}</section>}
  <section className="treasure-collection"><div className="treasure-heading"><h3>もちの宝もの棚</h3><span>{received.length}こ</span></div><div className="treasure-shelf" role="list" aria-label="受け取った贈りもの">{received.length?received.slice().reverse().slice(0,all?undefined:24).map(gift=><div role="listitem" key={gift.id}><button type="button" className={selected===gift.id?'selected':''} onClick={()=>selectGift(gift.id)} aria-label={gift.label+'を見る'}><KeepsakeArt label={gift.label}/><strong>{gift.label}</strong>{displayed===gift.id&&<span className="shelf-displayed"><Home size={12}/>飾り中</span>}</button></div>):<div className="treasure-empty"><Gift size={36}/><span>包みをひらくと、ここに並びます</span></div>}</div>{received.length>24&&!all&&<Button type="button" variant="ghost" onClick={()=>setAll(true)}>宝ものをすべて見る</Button>}</section>
  <section className="season-boxes"><h3>季節の小箱</h3><div className="season-box-grid">{seasonStories.map(([id,title,,label])=>{const received=companion.gifts.some(gift=>gift.id==='season:'+id+':'+state.settings.species);return <button type="button" key={id} disabled={disabled} className={'season-box season-'+id} onClick={async()=>{const key='season:'+id+':'+state.settings.species;if(!received&&!await onCommand({action:'seasonGift',season:id}))return;setSpecies(state.settings.species);selectGift(key)}}><KeepsakeArt label={label}/><strong>{title}</strong><span>{received?<><Check size={13}/>受取済み</>:'ひらく'}</span></button>})}</div></section>
  <details className="hub-secondary"><summary>3匹それぞれの宝もの</summary><div className="species-memory-switch">{pets.map(pet=><Button type="button" key={pet.id} aria-pressed={species===pet.id} variant={species===pet.id?'secondary':'outline'} onClick={()=>{setSpecies(pet.id);setSelected(null)}}>{pet.name}</Button>)}</div></details>
  {allRewardsUnlocked(state.stars)&&<details className="hub-secondary"><summary><Sparkles size={18}/>特別なもちのお話</summary><Pet species={state.settings.species} outfit="starlight" pose={3} small/>{afterStories.map(([title,text],index)=><details key={title} onToggle={event=>{if(event.currentTarget.open)void onCommand({action:'readLetter',id:'after-'+index})}}><summary>{title}</summary><p>{text}</p></details>)}</details>}
 </div>;
}
