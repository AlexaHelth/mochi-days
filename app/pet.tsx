'use client';
import { pets, outfits, expressionNames, petSprite, petFrame, type Species, type Outfit } from '@/lib/mochi';

export function Pet({species='dog',pose=0,outfit='none',small=false}:{species?:Species;pose?:number;outfit?:Outfit;small?:boolean}){
 const sprite=petSprite(species,pose,outfit,import.meta.env.BASE_URL+'pets'),column=sprite.cell%sprite.columns,row=Math.floor(sprite.cell/sprite.columns);
 const source=sprite.src.replace(/\.png$/,'.webp');
 const originalPuppy=sprite.src.endsWith('/puppy.png');
 const scale=originalPuppy?1.1:1,width=sprite.columns*scale,height=sprite.rows*scale;
 const offsetY=originalPuppy&&sprite.cell===3?0.07:0;
 const face=outfit==='none'?expressionNames[pose]:outfit==='starlight'?['にっこり','ばんざい','すやすや','きらめき'][sprite.cell]:(sprite.cell%2?'ごきげん':'にっこり');
 const label=`${pets.find(p=>p.id===species)?.name}・${face}・${outfits.find(o=>o.id===outfit)?.name}`,frame=petFrame(sprite);
 if(frame){
  const side=Math.max(frame.width,frame.height);
  return <div className={'puppy pet-art pet-framed '+(small?'small':'')} role="img" aria-label={label}><span className="pet-frame" aria-hidden="true" style={{width:`${frame.width/side*94}%`,height:`${frame.height/side*94}%`,backgroundImage:`url('${source}')`,backgroundSize:`${frame.sheetWidth/frame.width*100}% ${frame.sheetHeight/frame.height*100}%`,backgroundPosition:`${frame.x/(frame.sheetWidth-frame.width)*100}% ${frame.y/(frame.sheetHeight-frame.height)*100}%`}}/></div>;
 }
 return <div className={'puppy pet-art '+(small?'small':'')} role="img" aria-label={`${pets.find(p=>p.id===species)?.name}・${face}・${outfits.find(o=>o.id===outfit)?.name}`} style={{backgroundImage:`url('${source}')`,backgroundSize:`${width*100}% ${height*100}%`,backgroundPosition:`${((column+.5)*scale-.5)/(width-1)*100}% ${((row+.5)*scale-.5-offsetY)/(height-1)*100}%`}}/>;
}
