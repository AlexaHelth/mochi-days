'use client';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Brush, CircleDot, Cookie, Hand, Heart, Moon, Sparkles } from 'lucide-react';
import { Pet } from './pet';
import type { Outfit, Species } from '@/lib/mochi';

type Tool='pet'|'hug'|'brush'|'snack'|'toy';
const tools=[{id:'pet',label:'なでる',Icon:Hand},{id:'hug',label:'ぎゅっ',Icon:Heart},{id:'brush',label:'ブラシ',Icon:Brush},{id:'snack',label:'おやつ',Icon:Cookie},{id:'toy',label:'おもちゃ',Icon:CircleDot}] as const;
const hints:Record<Tool,string>={pet:'ゆっくりなぞって、なでてみてね',hug:'押したままで、ぎゅっと。ボタンでもできるよ',brush:'ブラシを選んで、毛並みをゆっくりなぞろう',snack:'気が向いたときに、小さなおやつをどうぞ',toy:'ボールをゆっくり動かして、一緒に遊ぼう'};
const replies:Record<Tool,Record<Species,string>>={
 pet:{dog:'ふりふり。なでてもらうと、うれしいな。',cat:'すりすり。きみのそばは、落ち着くね。',penguin:'ぱたぱた。なでてくれて、ありがとう。'},
 hug:{dog:'ぎゅっ。あったかいね。このまま、ひと息。',cat:'ぎゅっ。すり寄って、のんびりしよう。',penguin:'ぎゅっ。小さな羽で、そっとお返し。'},
 brush:{dog:'さらさら。ふわふわにしてくれて、ありがとう。',cat:'ふわふわ。ゆっくり整えるの、気持ちいいね。',penguin:'つやつや。羽もすっきり、うれしいな。'},
 snack:{dog:'もぐもぐ。小さなおやつ、おいしいね。',cat:'もぐもぐ。きみと一緒だと、うれしいな。',penguin:'もぐもぐ。のんびり、おやつの時間だね。'},
 toy:{dog:'ころころ。ボールを追いかけて、ふりふり。',cat:'ちょいちょい。気になるボール、見つけた。',penguin:'ころころ。小さな羽をぱたぱた、遊ぼう。'},
};
type Gesture={id:number;x:number;y:number;distance:number;reacted:boolean;hold:ReturnType<typeof setTimeout>|null};

export function PetPlayground({species,outfit,name,pose,message,resting=false,quiet=false,onInteract,onLounge,compact=false}:{species:Species;outfit:Outfit;name:string;pose:number;message:string;resting?:boolean;quiet?:boolean;onInteract?:()=>void;onLounge?:()=>void;compact?:boolean}){
 const [tool,setTool]=useState<Tool>('pet'),[reaction,setReaction]=useState<Tool|null>(null),[sequence,setSequence]=useState(0),[cursor,setCursor]=useState<{x:number;y:number}|null>(null),[blink,setBlink]=useState(false),[reduced,setReduced]=useState(false);
 const gesture=useRef<Gesture|null>(null),reactionTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
 useEffect(()=>{
  if(reduced||resting||reaction||pose===2||outfit!=='none')return;
  let end:ReturnType<typeof setTimeout>|undefined;
  const timer=setInterval(()=>{setBlink(true);end=setTimeout(()=>setBlink(false),160)},6200);
  return()=>{clearInterval(timer);clearTimeout(end);setBlink(false)};
 },[reduced,resting,reaction,pose,outfit]);
 useEffect(()=>()=>{if(reactionTimer.current)clearTimeout(reactionTimer.current);if(gesture.current?.hold)clearTimeout(gesture.current.hold)},[]);
 function respond(kind:Tool){
  if(reactionTimer.current)clearTimeout(reactionTimer.current);
  setReaction(kind);setSequence(n=>n+1);onInteract?.();
  reactionTimer.current=setTimeout(()=>setReaction(null),3400);
 }
 function point(event:PointerEvent<HTMLButtonElement>){const bounds=event.currentTarget.getBoundingClientRect();return {x:Math.max(8,Math.min(92,(event.clientX-bounds.left)/bounds.width*100)),y:Math.max(8,Math.min(92,(event.clientY-bounds.top)/bounds.height*100))};}
 function begin(event:PointerEvent<HTMLButtonElement>){
  if(!event.isPrimary||event.button!==0)return;
  event.currentTarget.setPointerCapture(event.pointerId);
  gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,distance:0,reacted:false,hold:null};setCursor(point(event));
  if(tool==='pet'||tool==='hug')gesture.current.hold=setTimeout(()=>{if(gesture.current){gesture.current.reacted=true;respond('hug')}},650);
 }
 function move(event:PointerEvent<HTMLButtonElement>){
  const active=gesture.current;if(!active||active.id!==event.pointerId)return;
  active.distance+=Math.hypot(event.clientX-active.x,event.clientY-active.y);active.x=event.clientX;active.y=event.clientY;setCursor(point(event));
  if(active.distance>12&&active.hold){clearTimeout(active.hold);active.hold=null;}
  if(active.distance>18&&!active.reacted){active.reacted=true;respond(tool);}
 }
 function finish(event:PointerEvent<HTMLButtonElement>,cancelled=false){
  const active=gesture.current;if(!active||active.id!==event.pointerId)return;
  if(active.hold)clearTimeout(active.hold);
  if(!cancelled&&!active.reacted)respond(tool);
  gesture.current=null;setCursor(null);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 const activePose=reaction==='hug'||reaction==='pet'||reaction==='brush'?1:reaction==='snack'?3:reaction==='toy'?4:resting?2:blink?1:pose;
 const shownMessage=reaction?replies[reaction][species]:resting?'今日は一緒に、のんびりしよう。休む時間も大切だね。':message;
 const ToolIcon=tools.find(item=>item.id===tool)!.Icon;
 const style={'--toy-lean':`${tool==='toy'&&cursor?(cursor.x-50)*.32:0}px`} as CSSProperties;
 return <div className={'pet-playground '+(compact?'compact ':'')+(resting?'resting ':'')}>
  <div className="speech playground-speech" aria-live="polite">{shownMessage}</div>
  <div className="playground-stage">
   <button type="button" className={'pet-surface '+(cursor?'touching':'')} aria-label={`${name}を${tools.find(item=>item.id===tool)!.label==='ぎゅっ'?'ぎゅっとする':tool==='pet'?'なでる':tool==='brush'?'ブラッシングする':tool==='snack'?'おやつで喜ばせる':'おもちゃで遊ぶ'}`} onPointerDown={begin} onPointerMove={move} onPointerUp={event=>finish(event)} onPointerCancel={event=>finish(event,true)} onLostPointerCapture={event=>finish(event,true)} onClick={event=>{if(event.detail===0)respond(tool)}} style={style}>
    <span key={`${species}-${sequence}`} className={`pet-motion species-${species} ${reaction?'reacting reaction-'+reaction:'idle'} ${reduced?'motion-reduced':''}`}><Pet species={species} outfit={outfit} pose={activePose}/></span>
    {resting&&<span className="rest-blanket" aria-hidden="true"><Moon size={16}/></span>}
    {reaction&&<span className={'playground-effects effects-'+reaction} key={sequence} aria-hidden="true">{[0,1,2].map(n=><span key={n}>{reaction==='brush'?<Sparkles size={18}/>:reaction==='snack'?<Cookie size={21}/>:reaction==='toy'?<CircleDot size={19}/>:<Heart size={21} fill="currentColor"/>}</span>)}</span>}
    {cursor&&<span className={'touch-tool tool-'+tool} aria-hidden="true" style={{left:cursor.x+'%',top:cursor.y+'%'}}><ToolIcon size={30}/></span>}
   </button>
  </div>
  <p className="pet-name">{name}<Heart size={14}/></p>
  <p className="pet-caption">{quiet?'そばで、のんびりしているよ。':hints[tool]}</p>
  <div className="pet-tools" aria-label="もちとの触れ合い">{tools.map(({id,label,Icon})=><button key={id} type="button" aria-label={id==='hug'?'ぎゅっとする':id==='brush'?'ブラッシング':id==='snack'?'おやつをあげる':id==='toy'?'おもちゃで遊ぶ':'なでる'} aria-pressed={tool===id} onClick={()=>{setTool(id);respond(id)}}><Icon size={18}/><span>{label}</span></button>)}</div>
  {onLounge&&<button type="button" className="lounge-link" onClick={onLounge}><Moon size={15}/>もちと、ひと休み</button>}
  {!quiet&&<p className="playground-note">回数も、お世話のノルマもないよ。気が向いたときに。</p>}
 </div>;
}

export function WaitingPet({species,outfit,saved=false}:{species:Species;outfit:Outfit;saved?:boolean}){
 return <div className="waiting-pet"><span className="waiting-pet-art"><Pet species={species} outfit={outfit} pose={saved?3:0} small/></span><span>{saved?'残せたね。おつかれさま。':'ゆっくりで大丈夫。ここで待っているよ。'}</span></div>;
}
