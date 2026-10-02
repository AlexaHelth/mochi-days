'use client';
import { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { outfits, type Species, type Outfit } from '@/lib/mochi';
import type { CompanionState } from '@/lib/companion';
import { outfitStory } from '@/lib/companion-content';
import { Pet } from './pet';

export function RewardDelivery({companion,species,disabled,onReceive,onPreview}:{companion:CompanionState;species:Species;disabled:boolean;onReceive:(id:Outfit)=>Promise<boolean>;onPreview:(id:Outfit)=>void}){
 const [revealed,setRevealed]=useState<Outfit|null>(null);
 const waiting=outfits.filter(item=>companion.receipts[item.id]&&!companion.receipts[item.id].seen),item=waiting.find(item=>item.id===revealed)??waiting[0];
 if(!item)return null;
 const receipt=companion.receipts[item.id],open=revealed===item.id;
 return <section className={'card reward-delivery '+(open?'present-revealed':'')} aria-label="もちから新しい衣装のプレゼント">
  <div className="section-heading"><h2><Gift size={20}/>もちから、小さな包み</h2><span className="subtle">{waiting.length}つ、待っているよ</span></div>
  {open?<><Pet species={species} outfit={item.id} pose={1} small/><h3>{item.name}</h3><p>{outfitStory(item.id,item.name,item.note)}</p><p className="receipt-origin">{receipt.day.replaceAll('-',' / ')} · {receipt.source}</p><div className="choice-row"><Button type="button" variant="outline" onClick={()=>onPreview(item.id)}>着たところを見る</Button><Button type="button" disabled={disabled} onClick={async()=>{if(await onReceive(item.id))setRevealed(null)}}><Sparkles size={16}/>大切にしまう</Button></div></>:<><button type="button" className="wrapped-present" aria-label="衣装の包みをそっとひらく" onClick={()=>setRevealed(item.id)}><Gift size={48}/><span>そっと、ひらいてみる</span></button><p>自分を気にかけたまいにちから。好きなときに受け取れるよ。</p></>}
 </section>;
}
