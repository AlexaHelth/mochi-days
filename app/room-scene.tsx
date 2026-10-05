'use client';
import type { RoomDesign } from '@/lib/companion';
import { KeepsakeArt } from './keepsake-art';
import { FurnitureIllustration, PlantIllustration, RugIllustration, SeasonIllustration, WindowIllustration } from './room-illustrations';

export function roomLight(design:RoomDesign,hour:number){return design.light==='auto'?(hour>=21||hour<6?'night':hour>=16?'evening':'morning'):design.light;}

export function RoomScene({design,hour,plant,onPlant,onFurniture,decorative=false,keepsake}:{design:RoomDesign;hour:number;plant:number;onPlant?:()=>void;onFurniture?:()=>void;decorative?:boolean;keepsake?:{label:string}}){
 const light=roomLight(design,hour);
 const plantArt=<PlantIllustration stage={plant}/>;
 const furnitureArt=<FurnitureIllustration kind={design.furniture}/>;
 return <>
  <div className={'scene-surround floor-'+design.floor+' palette-'+design.palette+' season-'+design.season+' light-'+light} aria-hidden="true">
   <div className="scene-floor"/>
   {design.floor==='rug'&&<span className="scene-rug"><RugIllustration/></span>}
   <span className="scene-window"><WindowIllustration weather={design.weather} light={light} season={design.season}/></span>
   <span className="scene-season"><SeasonIllustration season={design.season}/></span>
   <span className="scene-lamp"/>
  </div>
  {decorative?<span className={'scene-plant plant-'+plant} aria-hidden="true">{plantArt}</span>:<button type="button" className={'scene-plant plant-'+plant} onClick={onPlant} aria-label="もちと小さな鉢を育てる">{plantArt}</button>}
  {decorative?<span className={'scene-furniture furniture-'+design.furniture} aria-hidden="true">{furnitureArt}</span>:<button type="button" className={'scene-furniture furniture-'+design.furniture} onClick={onFurniture} aria-label={{bed:'ベッドで一緒に休む',cushion:'クッションでくつろぐ',book:'もちと絵本を開く',ball:'お部屋のボールで遊ぶ'}[design.furniture]}>{furnitureArt}</button>}
  {keepsake&&<span className="scene-keepsake" aria-label={'お部屋に飾った'+keepsake.label}><KeepsakeArt label={keepsake.label} small/></span>}
 </>;
}
