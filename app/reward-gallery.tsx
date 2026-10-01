'use client';
import { useState } from 'react';
import { Check, LockKeyhole, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { regularOutfits, rooms, pets, allRewardsCost, allRewardsUnlocked, type Settings, type Outfit } from '@/lib/mochi';
import { Pet } from './pet';

const groups=['いつものおめかし','お花とくだもの','まいにちのおしごと','夢とお祝い'];
export function RewardGallery({settings,stars,disabled,onEquip,onMeet}:{settings:Settings;stars:number;disabled:boolean;onEquip:(outfit:Outfit)=>void;onMeet:()=>void}){
 const [group,setGroup]=useState<number|null>(null);
 const unlockedCount=regularOutfits.filter(outfit=>outfit.cost<=stars).length;
 const completed=unlockedCount+rooms.filter(room=>room.cost<=stars).length,total=regularOutfits.length+rooms.length;
 const allUnlocked=allRewardsUnlocked(stars);
 const visible=regularOutfits.filter((_,index)=>group===null||Math.floor(index/8)===group);
 return <section className="wardrobe reward-collection">
  <div className="section-heading"><div><h2>相棒のクローゼット</h2><p className="support-copy">3匹それぞれのおめかし。今の相棒に着せられるよ。</p></div><span className="reward-count">{unlockedCount} / {regularOutfits.length} 解放</span></div>
  <div className="reward-filters" aria-label="衣装の種類"><Button type="button" variant={group===null?'secondary':'outline'} aria-pressed={group===null} onClick={()=>setGroup(null)}>すべて・{regularOutfits.length}種類</Button>{groups.map((label,index)=><Button key={label} type="button" variant={group===index?'secondary':'outline'} aria-pressed={group===index} onClick={()=>setGroup(index)}>{label}</Button>)}</div>
  <div className="reward-gallery-grid">{visible.map(outfit=>{const unlocked=stars>=outfit.cost,selected=settings.outfit===outfit.id;return <article key={outfit.id} className={'room-card reward-outfit-card '+(selected?'chosen':'')}><div className={'reward-preview-trio '+(!unlocked?'reward-preview-locked':'')}>{pets.map(pet=><figure key={pet.id}><Pet species={pet.id} outfit={outfit.id} pose={selected&&settings.species===pet.id?1:0} small/><figcaption>{pet.name}</figcaption></figure>)}{!unlocked&&<span className="reward-cost"><LockKeyhole size={13}/>{outfit.cost}こでひらく</span>}</div><div className="room-details"><h3>{outfit.name}</h3><p className="outfit-note">{outfit.note}</p><Button variant={selected?'secondary':'outline'} disabled={!unlocked||selected||disabled} aria-label={`${outfit.name}${selected?'を着ている':unlocked?'を着る':'は未解放'}`} onClick={()=>onEquip(outfit.id)}>{selected?<><Check size={15}/>着ているよ</>:unlocked?'この衣装を着る':<><Star size={14}/>あと {outfit.cost-stars}こ</>}</Button></div></article>})}</div>
  <div className="wardrobe-return"><Button variant="ghost" disabled={disabled||settings.outfit==='none'} onClick={()=>onEquip('none')}>いつものすがたに戻す</Button><p className="support-copy">ひらいた衣装は何度でも着替えられるよ。おほしさまは減りません。</p></div>
  <section className={'special-reward '+(allUnlocked?'unlocked':'')} aria-label="全解放の特別なもち"><div className="section-heading"><span className="small-label"><Sparkles size={17}/>すべてひらいた、その先に</span><span className="subtle">{completed} / {total}</span></div><h2>{allUnlocked?'ほしぞらの特別なもち':'特別なもちが、待っているよ'}</h2>{allUnlocked?<><div className="special-pets">{pets.map(pet=><figure key={pet.id}><Pet species={pet.id} outfit="starlight" pose={1} small/><figcaption>{pet.name}の特別なすがた</figcaption></figure>)}</div><p>ここまでのまいにちに、ありがとう。<br/>きらめく特別な相棒と、これからも一緒に。</p><Button className="special-meet-button" disabled={disabled} onClick={onMeet}><Sparkles size={18}/>特別なもちに会う</Button></>:<><div className="special-mystery" aria-hidden="true"><Sparkles size={48}/><LockKeyhole size={22}/></div><p>32種類の衣装と、すべてのお部屋をひらくと、<br/>今の相棒の特別なすがたに会えます。</p><Progress value={Math.min(100,stars/allRewardsCost*100)} aria-label="全ごほうびの解放まで"/><span className="special-remaining">あと {Math.max(0,allRewardsCost-stars)}こで、すべて解放</span></>}</section>
 </section>;
}
