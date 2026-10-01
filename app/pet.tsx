'use client';
import { pets, outfits, expressionNames, petSprite, type Species, type Outfit } from '@/lib/mochi';

export function Pet({species='dog',pose=0,outfit='none',small=false}:{species?:Species;pose?:number;outfit?:Outfit;small?:boolean}){
 const sprite=petSprite(species,pose,outfit,import.meta.env.BASE_URL+'pets'),column=sprite.cell%sprite.columns,row=Math.floor(sprite.cell/sprite.columns);
 const originalPuppy=sprite.src.endsWith('/puppy.png');
 const scale=originalPuppy?1.1:1,width=sprite.columns*scale,height=sprite.rows*scale;
 const offsetY=originalPuppy&&sprite.cell===3?0.07:0;
 const face=outfit==='none'?expressionNames[pose]:outfit==='starlight'?['にっこり','ばんざい','すやすや','きらめき'][sprite.cell]:(sprite.cell%2?'ごきげん':'にっこり');
 return <div className={'puppy pet-art '+(small?'small':'')} role="img" aria-label={`${pets.find(p=>p.id===species)?.name}・${face}・${outfits.find(o=>o.id===outfit)?.name}`} style={{backgroundImage:`url('${sprite.src}')`,backgroundSize:`${width*100}% ${height*100}%`,backgroundPosition:`${((column+.5)*scale-.5)/(width-1)*100}% ${((row+.5)*scale-.5-offsetY)/(height-1)*100}%`}}/>;
}
