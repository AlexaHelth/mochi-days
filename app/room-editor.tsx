'use client';
import { useEffect, useState } from 'react';
import { Armchair, Bed, BookOpen, CircleDot, Sun, CloudRain, Snowflake, Moon, Clock, Flower2, Leaf, Palette, Home, Lamp, Check, Star, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pet } from './pet';
import { RoomScene } from './room-scene';
import type { Species, Outfit } from '@/lib/mochi';
import type { CompanionState, CompanionAction, RoomDesign } from '@/lib/companion';

const categories=[['palette','色',Palette],['furniture','家具',Armchair],['floor','床',Home],['weather','天気',CloudRain],['light','光',Lamp],['season','季節',Flower2]] as const;
const choices={
 palette:[['warm','あたたかい',Palette],['leaf','葉っぱ色',Leaf],['sky','空色',Sun],['clear','はっきり',CircleDot]],
 furniture:[['cushion','クッション',Armchair],['bed','ベッド',Bed],['book','絵本',BookOpen],['ball','ボール',CircleDot]],
 floor:[['wood','木の床',Home],['rug','ラグ',CircleDot],['meadow','草原',TreePine]],
 weather:[['sun','晴れ',Sun],['rain','小雨',CloudRain],['snow','雪',Snowflake]],
 light:[['auto','今の時間',Clock],['morning','朝',Sun],['evening','夕方',Lamp],['night','夜',Moon]],
 season:[['plain','いつも',Home],['spring','春',Flower2],['summer','夏',Sun],['autumn','秋',Leaf],['winter','冬',Snowflake]],
} as const;

export function RoomPreview({design,species,outfit,hour,keepsake}:{design:RoomDesign;species:Species;outfit:Outfit;hour:number;keepsake?:{label:string}}){
 return <div className={'room-snapshot snapshot-'+design.palette} role="img" aria-label="選んだお部屋のプレビュー"><div className="playground-stage with-scene"><RoomScene design={design} hour={hour} plant={1} decorative keepsake={keepsake}/><Pet species={species} outfit={outfit} pose={design.furniture==='bed'?2:0}/></div></div>;
}
export function RoomEditor({companion,species,outfit,hour,disabled,onCommand}:{companion:CompanionState;species:Species;outfit:Outfit;hour:number;disabled:boolean;onCommand:(command:CompanionAction)=>Promise<boolean>}){
 const [room,setRoom]=useState(companion.preferences.room),[category,setCategory]=useState<keyof typeof choices>('palette'),[dirty,setDirty]=useState(false),[saved,setSaved]=useState(false),[favoriteName,setFavoriteName]=useState('');
 useEffect(()=>{if(!dirty)setRoom(companion.preferences.room)},[companion.preferences.room,dirty]);
 const keepsake=companion.gifts.find(item=>item.id===room.keepsakeId&&item.opened);
 async function save(){if(await onCommand({action:'preference',patch:{room}})){setDirty(false);setSaved(true);return true}return false;}
 function choose(value:string){setRoom({...room,[category]:value});setDirty(true);setSaved(false);}
 return <><div className="hub-content room-editor-content"><RoomPreview design={room} species={species} outfit={outfit} hour={hour} keepsake={keepsake}/>
  <div className="room-category-choices" aria-label="模様がえの種類">{categories.map(([id,label,Icon])=><button type="button" key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}><Icon size={20}/><span>{label}</span></button>)}</div>
  <div className={'room-visual-choices choices-'+category} aria-label={categories.find(item=>item[0]===category)?.[1]+'の選択'}>{choices[category].map(([id,label,Icon])=><button type="button" disabled={disabled} key={id} aria-pressed={room[category]===id} onClick={()=>choose(id)}><span className={'room-choice-art choice-'+category+'-'+id}><Icon size={29}/></span><strong>{label}</strong>{room[category]===id&&<Check size={16} className="tile-check"/>}</button>)}</div>
  <details className="hub-secondary"><summary><Star size={18}/>お気に入りのお部屋</summary><div className="choice-row"><input aria-label="お気に入りのお部屋の名前" value={favoriteName} maxLength={20} onChange={event=>setFavoriteName(event.target.value)} placeholder="お部屋の名前"/><Button type="button" disabled={disabled||!favoriteName.trim()} onClick={async()=>{if(dirty&&!await save())return;if(await onCommand({action:'roomFavorite',name:favoriteName.trim()}))setFavoriteName('')}}>お気に入りに保存</Button></div>{companion.preferences.favorites.map((item,index)=><div className="favorite-room" key={item.name}><button type="button" disabled={disabled} className="favorite-room-preview" onClick={()=>{setRoom(item.design);setDirty(true);setSaved(false)}}><RoomPreview design={item.design} species={species} outfit={outfit} hour={hour}/><span>{item.name}</span></button><Button type="button" variant="ghost" disabled={disabled} aria-label={item.name+'をお気に入りから外す'} onClick={()=>void onCommand({action:'removeFavorite',index})}>外す</Button></div>)}</details>
  {keepsake&&<button type="button" className="room-remove-keepsake" disabled={disabled} onClick={()=>{setRoom({...room,keepsakeId:null});setDirty(true);setSaved(false)}}>飾った贈りものを棚へ戻す</button>}
 </div><div className="hub-action-footer"><Button type="button" disabled={disabled||!dirty} onClick={()=>void save()}><Check size={18}/>{saved?'お部屋を保存しました':'このお部屋にする'}</Button></div></>;
}
