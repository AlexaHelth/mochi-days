import type { ReactNode } from 'react';

// These fragments are drawn inside the keepsake's existing 96 × 96 SVG.
// A calendar day chooses one of 4 bloom shapes × 5 containers × 7 colors.
const ink = '#806d5c';
const leafInk = '#68846b';
const leafGreen = '#91ad89';

const flowerColors = [
 {petal:'#d8989b',light:'#f2ced0',center:'#edc98a'},
 {petal:'#dfb67d',light:'#f8dfad',center:'#ad8464'},
 {petal:'#b6a1c0',light:'#ddd0e4',center:'#e6c17c'},
 {petal:'#91b8b1',light:'#c7dcd4',center:'#e8c184'},
 {petal:'#d89579',light:'#f4c8af',center:'#f1ce8f'},
 {petal:'#d9abb6',light:'#f5dce0',center:'#e3bc7c'},
 {petal:'#a7b58a',light:'#d9dfbb',center:'#e7c991'},
] as const;

function roundFlower(x:number,y:number,petal:string,light:string,center:string,small=false){
 const petals=small?5:6;
 return <g transform={`translate(${x} ${y})`}>
  {Array.from({length:petals},(_,index)=><ellipse key={index} cx="0" cy={small?-6:-8} rx={small?3.4:4.2} ry={small?6:8} transform={`rotate(${index*360/petals})`} fill={index%2?petal:light} stroke="#ab8b7f" strokeWidth=".65"/>)}
  <circle r={small?3.4:4.5} fill={center} stroke="#a78560" strokeWidth="1"/>
 </g>;
}

function dailyBloom(shape:number,color:typeof flowerColors[number]):ReactNode {
 const {petal,light,center}=color;
 if(shape===0)return <>
  <path d="M46 64Q45 47 44 30" fill="none" stroke={leafInk} strokeWidth="2.6" strokeLinecap="round"/>
  <path d="M45 53Q34 40 29 48q1 7 16 9M46 48q8-13 17-10-1 9-16 15" fill={leafGreen} stroke={leafInk} strokeWidth="1.2"/>
  {roundFlower(44,27,petal,light,center)}
 </>;
 if(shape===1)return <>
  <path d="M43 65Q41 47 35 35m11 30q9-28 13-39" fill="none" stroke={leafInk} strokeWidth="2.4" strokeLinecap="round"/>
  <path d="M43 56Q31 44 25 49q3 8 19 11m6-6q13-15 19-10-2 8-20 14" fill={leafGreen} stroke={leafInk} strokeWidth="1.1"/>
  <path d="M27 31q2-15 8-8 5-8 9 7l-3 8q-8 5-14-1Z" fill={light} stroke="#a77d79" strokeWidth="1.5"/>
  <path d="M49 24q2-15 9-7 5-8 10 8l-4 8q-8 4-15-1Z" fill={petal} stroke="#a77d79" strokeWidth="1.5"/>
  <path d="M35 35V25m23 6V20" stroke="#f8e9d7" strokeWidth="1.2" opacity=".8"/>
 </>;
 if(shape===2)return <>
  <path d="M43 64Q38 44 34 29m13 35q5-27 14-39" fill="none" stroke={leafInk} strokeWidth="2.4" strokeLinecap="round"/>
  <path d="M43 55Q34 45 26 49q2 8 17 10m9-8q13-13 19-9-2 9-20 14" fill={leafGreen} stroke={leafInk} strokeWidth="1.1"/>
  <path d="M27 31q8-6 16-1l-3 11q-6 8-12 1Z" fill={light} stroke="#aa817a" strokeWidth="1.5"/>
  <path d="M53 26q8-6 17-1l-4 11q-7 8-13 0Z" fill={petal} stroke="#aa817a" strokeWidth="1.5"/>
  <path d="M31 36q5 3 9 0m17-7q5 3 10 0" fill="none" stroke="#fff7e7" strokeWidth="1.5"/>
  <circle cx="35" cy="40" r="2" fill={center}/><circle cx="62" cy="35" r="2" fill={center}/>
 </>;
 return <>
  <path d="M45 65Q35 47 32 32m15 33Q48 42 49 25m1 40q7-24 15-33" fill="none" stroke={leafInk} strokeWidth="2.3" strokeLinecap="round"/>
  <path d="M44 55Q32 42 26 47q1 7 19 13m9-11q12-11 18-6-2 8-18 12" fill={leafGreen} stroke={leafInk} strokeWidth="1.1"/>
  {roundFlower(31,30,petal,light,center,true)}
  {roundFlower(49,24,light,petal,center,true)}
  {roundFlower(65,31,petal,light,center,true)}
 </>;
}

function dailyContainer(shape:number):ReactNode {
 if(shape===0)return <>
  <path d="M27 56h42l-5 23q-17 6-32 0Z" fill="#d4a17c" stroke={ink} strokeWidth="1.8"/>
  <path d="M25 55h46v7H25Z" fill="#e9be98" stroke={ink} strokeWidth="1.7"/>
  <path d="M35 69q13 5 27 0" fill="none" stroke="#f7d9b9" strokeWidth="2"/>
 </>;
 if(shape===1)return <>
  <path d="M32 52q-4 8-3 24 17 10 38 0 1-16-3-24Z" fill="#add0cc" stroke="#6b9b99" strokeWidth="1.8"/>
  <ellipse cx="48" cy="52" rx="16" ry="4" fill="#d2e4db" stroke="#6b9b99" strokeWidth="1.5"/>
  <path d="M36 67q12 5 24 0" fill="none" stroke="#eef6e9" strokeWidth="2"/>
 </>;
 if(shape===2)return <>
  <path d="M25 52 48 61l23-9-7 29q-16 6-32 0Z" fill="#f2e5cf" stroke="#aa8e71" strokeWidth="1.8"/>
  <path d="M25 52 34 49l14 12 14-12 9 3M48 61v22" fill="none" stroke="#c4a686" strokeWidth="1.4"/>
  <path d="M39 69q9 7 18 0" fill="none" stroke="#d9a5a3" strokeWidth="3"/>
 </>;
 if(shape===3)return <>
  <path d="M26 61q0-21 22-21t22 21" fill="none" stroke="#a78264" strokeWidth="4"/>
  <path d="M23 57q25 8 50 0l-6 21q-19 9-38 0Z" fill="#d7b18b" stroke="#927252" strokeWidth="1.8"/>
  <path d="M28 66q21 8 40 0m-35 7q16 6 31 0" fill="none" stroke="#f2dec1" strokeWidth="2"/>
 </>;
 return <>
  <path d="M26 53h38v23q-16 11-38 0Z" fill="#e4bdb4" stroke="#a57c76" strokeWidth="1.8"/>
  <path d="M65 59q16-4 13 10-2 10-14 7" fill="none" stroke="#a57c76" strokeWidth="4"/>
  <ellipse cx="45" cy="53" rx="19" ry="4" fill="#f3d9cb" stroke="#a57c76" strokeWidth="1.5"/>
  <path d="M34 66q12 5 23 0" fill="none" stroke="#fff0df" strokeWidth="2"/>
 </>;
}

function dailyFlower(id?:string):ReactNode {
 const match=/^daily:(\d{4})-(\d{2})-(\d{2})$/.exec(id??'');
 // UTC keeps the gift's appearance tied to its saved day on every device.
 const day=match?Math.floor(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]))/86_400_000):0;
 const variant=((day%140)+140)%140;
 return <>
  {dailyBloom(variant%4,flowerColors[Math.floor(variant/20)])}
  {dailyContainer(Math.floor(variant/4)%5)}
 </>;
}

export function floraArt(label:string,id?:string):ReactNode|null {
 switch(label){
  case '今日の小さなお花':return dailyFlower(id);
  case 'はじめましての一輪':return <>
   <path d="M48 72Q47 46 47 29" fill="none" stroke={leafInk} strokeWidth="2.8" strokeLinecap="round"/>
   <path d="M47 56Q32 43 27 50q1 8 20 12m0-14q12-14 21-8-3 9-21 13" fill="#a4bb96" stroke={leafInk} strokeWidth="1.2"/>
   {roundFlower(47,27,'#d79ca7','#f1cbd1','#ebc78e')}
   <path d="M25 60 48 73l23-13-8 22q-14 7-30 0Z" fill="#f4e8d6" stroke="#ae927b" strokeWidth="1.8"/>
   <path d="M25 60 48 73l23-13M48 73v11" fill="none" stroke="#ceb69a" strokeWidth="1.5"/>
   <path d="M42 70q6 7 12 0m-6 3-3 8m3-8 5 8" fill="none" stroke="#ca8c91" strokeWidth="2.8" strokeLinecap="round"/>
  </>;
  case '白い花びら':return <>
   <path d="M18 53q30-9 60 0v24q-28 12-60 0Z" fill="#e8cbb6" stroke="#a98774" strokeWidth="1.8"/>
   <path d="M18 54 48 71l30-17M18 77l30-17 30 17" fill="none" stroke="#b89983" strokeWidth="1.4"/>
   <path d="M39 53q-14-17-3-30 9-10 17 0 8 16-9 31Z" fill="#fff9ed" stroke="#d5bcb4" strokeWidth="1.8"/>
   <path d="M44 50Q49 33 37 26" fill="none" stroke="#e8d8cd" strokeWidth="1.8"/>
   <path d="M50 55q-3-18 11-24 11 0 12 11-1 13-19 16Z" fill="#f8eee5" stroke="#d5bcb4" strokeWidth="1.6"/>
   <circle cx="49" cy="61" r="3.5" fill="#d8aa94"/>
  </>;
  case '街の一輪の花':return <>
   <path d="M49 72Q43 51 48 31" fill="none" stroke={leafInk} strokeWidth="2.7" strokeLinecap="round"/>
   <path d="M46 57Q35 45 31 49q0 7 17 12m0-14q13-12 18-8-2 8-18 14" fill="#98b392" stroke={leafInk} strokeWidth="1.1"/>
   {roundFlower(48,28,'#dfb47f','#f4d6a4','#ad815d')}
   <path d="M21 50 48 82l27-32-18 6-9 17-10-17Z" fill="#dcc09a" stroke="#96785d" strokeWidth="1.8"/>
   <path d="M21 50 37 56l11 17 10-17 17-6M37 56l-4 10m25-10 5 10" fill="none" stroke="#f2dec0" strokeWidth="1.6"/>
   <path d="M37 68q11 7 22 0m-11 5-4 9m4-9 6 9" fill="none" stroke="#b17870" strokeWidth="3" strokeLinecap="round"/>
  </>;
  case '春の白い花':return <>
   <path d="M47 66Q46 43 46 30" fill="none" stroke={leafInk} strokeWidth="2.6" strokeLinecap="round"/>
   <path d="M45 54Q33 43 28 49q2 8 18 10m2-14q13-13 20-7-2 9-20 13" fill="#a5c3a1" stroke={leafInk} strokeWidth="1.2"/>
   {roundFlower(46,28,'#fff8eb','#f4eee7','#e7c783')}
   <path d="M25 58h44l-5 22q-17 6-34 0Z" fill="#cd9f80" stroke="#936e58" strokeWidth="1.8"/>
   <path d="M23 56h48v7H23Z" fill="#e0b291" stroke="#936e58" strokeWidth="1.7"/>
   <path d="M34 70q13 5 26 0" fill="none" stroke="#f3d0b2" strokeWidth="2"/>
  </>;
  case '小さな葉っぱ':return <>
   <path d="M27 76q20-28 40-49" fill="none" stroke={leafInk} strokeWidth="3" strokeLinecap="round"/>
   <path d="M36 63Q22 42 34 25q15-14 34-9 2 22-13 36-9 8-19 11Z" fill="#9cbb8f" stroke={leafInk} strokeWidth="2"/>
   <path d="M36 61q14-28 32-45M45 45 33 37m19-1-2-14" fill="none" stroke="#e4e9bb" strokeWidth="2" strokeLinecap="round"/>
  </>;
  case '葉っぱのしおり':return <>
   <path d="M33 14h31v66L49 68 33 80Z" fill="#f5e8cf" stroke="#a28b70" strokeWidth="1.8"/>
   <path d="M38 18h21v52l-10-8-11 8Z" fill="#fbf5e7"/>
   <path d="M49 57Q35 43 42 30q9-12 20-8 2 16-10 30Z" fill="#9cb393" stroke={leafInk} strokeWidth="1.5"/>
   <path d="M49 57q4-24 13-35m-12 22-9-8" fill="none" stroke="#edf0ce" strokeWidth="1.6"/>
   <path d="M49 14V7m0 0q-5-3-8 2m8-2q5-3 8 2" fill="none" stroke="#c48176" strokeWidth="3" strokeLinecap="round"/>
   <path d="M38 65 49 59l10 6" fill="none" stroke="#cfb99b" strokeWidth="1.3"/>
  </>;
  case '葉っぱの毛布':return <>
   <path d="M16 36q14-11 34-8 18 3 29 12l-5 35q-28 8-54-2Z" fill="#d8d9bc" stroke="#819176" strokeWidth="2"/>
   <path d="M16 36q30-2 63 4l-2 13q-30-10-58-4Z" fill="#a6bd9a" stroke="#819176" strokeWidth="1.5"/>
   <path d="M28 56q4-8 11-3 2 8-9 12-8-3-2-9Zm23 5q5-9 13-4 2 8-10 14-8-3-3-10Z" fill="#86a486" stroke="#729075" strokeWidth="1.2"/>
   <path d="M30 64q6-5 9-11m16 17q5-5 9-13" fill="none" stroke="#dce8c7" strokeWidth="1.4"/>
   <path d="M24 74v7m10-6v7m10-6v7m10-6v7m10-7v7m9-9v7" stroke="#718c70" strokeWidth="2" strokeLinecap="round"/>
  </>;
  case '秋のまあるい葉っぱ':return <>
   <path d="M46 67Q24 70 18 54q-7-19 12-31 16-10 29-2 16-3 21 17 4 19-18 29-7 4-16 0Z" fill="#d5a268" stroke="#986e53" strokeWidth="2"/>
   <path d="M47 66Q45 40 59 21m-10 38-23-8m25-2 25-9m-21-5-21-9" fill="none" stroke="#f2d6a0" strokeWidth="2" strokeLinecap="round"/>
   <path d="M47 65q-3 12-5 18" fill="none" stroke="#986e53" strokeWidth="3" strokeLinecap="round"/>
   <path d="M25 40q-2 13 8 17" fill="none" stroke="#f7e3bb" strokeWidth="2" opacity=".8"/>
  </>;
  default:return null;
 }
}
