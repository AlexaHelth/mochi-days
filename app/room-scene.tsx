'use client';
import { BookOpen, CircleDot, Moon, Sun, Sprout, Flower2, Bed, Armchair, Coffee, Leaf, Snowflake } from 'lucide-react';
import type { RoomDesign } from '@/lib/companion';
export function roomLight(design:RoomDesign,hour:number){return design.light==='auto'?(hour>=21||hour<6?'night':hour>=16?'evening':'morning'):design.light;}
export function RoomScene({design,hour,plant,onPlant,onFurniture}:{design:RoomDesign;hour:number;plant:number;onPlant:()=>void;onFurniture:()=>void}){
 const light=roomLight(design,hour),Furniture={bed:Bed,cushion:Armchair,book:BookOpen,ball:CircleDot}[design.furniture],Season={plain:null,spring:Flower2,summer:Sun,autumn:Leaf,winter:Snowflake}[design.season];
 return <>
  <div className={'scene-surround floor-'+design.floor+' palette-'+design.palette+' season-'+design.season+' light-'+light} aria-hidden="true"><div className="scene-floor"/><div className="scene-window"><span className="scene-sky"/>{light==='night'?<Moon size={15}/>:<Sun size={18}/>}<span className="window-cross"/></div><span className="scene-lamp"/>{design.weather!=='sun'&&<div className={'scene-weather weather-'+design.weather}>{Array.from({length:8},(_,i)=><i key={i} style={{left:(i*13+5)+'%',animationDelay:i*.31+'s'}}/>)}</div>}</div>
  {Season&&<span className={'scene-season decoration-'+design.season} aria-hidden="true"><Season size={20}/><Season size={14}/><Season size={20}/></span>}
  <span className="scene-life" aria-hidden="true">{hour>=10&&hour<16?<Coffee size={25}/>:hour>=16&&hour<21?<BookOpen size={25}/>:null}</span>
  <button type="button" className={'scene-plant plant-'+plant} onClick={onPlant} aria-label="もちと小さな鉢を育てる">{plant>=3?<Flower2 size={plant===4?34:29}/>:<Sprout size={18+plant*5}/>}<span className="plant-pot"/></button>
  <button type="button" className={'scene-furniture furniture-'+design.furniture} onClick={onFurniture} aria-label={{bed:'ベッドで一緒に休む',cushion:'クッションでくつろぐ',book:'もちと絵本を開く',ball:'お部屋のボールで遊ぶ'}[design.furniture]}><Furniture size={37}/></button>
 </>;
}
