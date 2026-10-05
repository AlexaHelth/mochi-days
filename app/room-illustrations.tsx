import type { RoomDesign } from '@/lib/companion';
import type { ReactNode } from 'react';

type Furniture = RoomDesign['furniture'];
type Weather = RoomDesign['weather'];
type Light = Exclude<RoomDesign['light'], 'auto'>;
type Season = RoomDesign['season'];
type ChoiceCategory = Exclude<keyof RoomDesign, 'keepsakeId'>;

const ink = '#8b6d58';
type Place = { x?: number; y?: number; width?: number; height?: number };

export function WindowIllustration({weather,light='morning',season='plain',...place}:{weather:Weather;light?:Light;season?:Season}&Place){
 const night=light==='night', evening=light==='evening';
 const sky=night?'#6e829d':evening?'#efbba5':'#b8d8df';
 const hill=night?'#738b83':season==='winter'?'#e7e8df':season==='autumn'?'#b7a17b':'#9fbea1';
 return <svg viewBox="0 0 88 94" aria-hidden="true" focusable="false" {...place}>
  <rect x="2" y="2" width="84" height="90" rx="9" fill="#a98264"/>
  <rect x="7" y="6" width="74" height="80" rx="5" fill="#f9e9ce"/>
  <rect x="11" y="10" width="66" height="72" rx="3" fill={sky}/>
  {night&&weather==='sun'?<><circle cx="61" cy="24" r="10" fill="#fff1c7"/><circle cx="65" cy="20" r="10" fill={sky}/><circle cx="24" cy="19" r="1.5" fill="#fff5d8"/><circle cx="44" cy="30" r="1.2" fill="#fff5d8"/></>:weather==='sun'?<circle cx="59" cy="29" r="11" fill={evening?'#ffdfad':'#fff4cd'}/>:<path d="M20 32q-4-9 6-11 5-9 14-4 10-5 16 4 9 0 9 9-1 8-12 8H28q-9 0-8-6Z" fill={weather==='rain'?'#edf0e9':'#fff8f1'} stroke="#9eb5b7" strokeWidth="1.3"/>}
  <path d="M11 62 Q25 44 42 62 T77 57 V82 H11Z" fill={hill}/>
  <path d="M11 72 Q31 59 48 72 T77 65 V82 H11Z" fill={night?'#5d776d':season==='winter'?'#f8f6eb':'#72987e'}/>
  {weather==='rain'&&<g stroke="#608da2" strokeWidth="2.5" strokeLinecap="round" opacity=".9"><path d="m23 39-4 9m18-7-4 9m18-7-4 9m18-12-4 9m-39 5-4 9m22-9-4 9m26-3-4 9"/></g>}
  {weather==='snow'&&<g fill="#fffaf0" stroke="#8ba8b4" strokeWidth=".7"><circle cx="22" cy="44" r="2.6"/><circle cx="36" cy="50" r="2"/><circle cx="53" cy="43" r="2.3"/><circle cx="69" cy="46" r="2.5"/><circle cx="28" cy="55" r="2"/><circle cx="58" cy="60" r="2"/></g>}
  {weather==='sun'&&!night&&<g fill="#fff8e5" opacity=".87"><ellipse cx="26" cy="34" rx="10" ry="4"/><ellipse cx="38" cy="38" rx="9" ry="3"/></g>}
  <path d="M44 8v75M9 47h70" stroke="#fff2dd" strokeWidth="4"/>
  <path d="M2 9 Q6 29 4 57 Q14 46 16 27 L15 8Z M86 9 Q82 29 84 57 Q74 46 72 27 L73 8Z" fill="#f3d9c4" opacity=".86"/>
  <rect x="1" y="84" width="86" height="8" rx="3" fill="#c59d77"/>
 </svg>;
}

export function FurnitureIllustration({kind,...place}:{kind:Furniture}&Place){
 return <svg viewBox="0 0 72 64" aria-hidden="true" focusable="false" {...place}>
  <ellipse cx="36" cy="57" rx="30" ry="4" fill="#6e503b" opacity=".12"/>
  {kind==='cushion'&&<>
   <path d="M12 40 Q11 22 27 21 H46 Q61 22 60 40 Q60 52 48 53 H23 Q12 52 12 40Z" fill="#d8a989" stroke={ink} strokeWidth="2"/>
   <path d="M17 38 Q22 26 35 26 Q49 25 55 38 Q54 47 46 49 H25 Q18 47 17 38Z" fill="#f1d1b2"/>
   <path d="M28 28 Q34 38 27 48 M45 27 Q39 38 46 48" stroke="#d29f87" strokeWidth="1.4" fill="none"/>
   <circle cx="36" cy="38" r="2" fill="#bb846b"/><path d="M17 44 Q10 49 9 53M55 44q8 5 8 9" stroke="#b88167" strokeWidth="2" strokeLinecap="round"/>
  </>}
  {kind==='bed'&&<>
   <path d="M10 26 Q10 18 15 18 H18 Q22 18 22 26 V48 H10Z" fill="#bc8c68" stroke={ink} strokeWidth="2"/>
   <rect x="12" y="42" width="51" height="12" rx="3" fill="#bd8c68" stroke={ink} strokeWidth="2"/>
   <path d="M19 31 Q28 27 53 29 Q62 30 62 40 V45 H19Z" fill="#f7ead3" stroke={ink} strokeWidth="1.5"/>
   <path d="M29 31 Q45 32 61 36 V45 H19 V37Z" fill="#a9bca8"/>
   <path d="M29 32q3 8 0 13m14-12q2 8 0 12" stroke="#e4e8d8" strokeWidth="1.5"/>
   <rect x="19" y="29" width="14" height="9" rx="4" fill="#fff9ec" stroke="#d1b8a1"/>
   <path d="M15 54v5m44-5v5" stroke={ink} strokeWidth="3" strokeLinecap="round"/>
  </>}
  {kind==='book'&&<>
   <path d="M12 46q12-5 24 3 12-8 24-3v10q-12-4-24 3-12-7-24-3Z" fill="#b78968" stroke={ink} strokeWidth="1.5"/>
   <path d="M14 28q11-5 22 3 11-8 22-3v21q-11-5-22 3-11-8-22-3Z" fill="#fff6e8" stroke={ink} strokeWidth="1.6"/>
   <path d="M36 31v21" stroke="#cbbba2" strokeWidth="1.4"/>
   <path d="M18 43q7-10 14-2v5q-8-3-14 0ZM40 42q6-9 14-3v6q-7-3-14 1Z" fill="#9fbea1"/>
   <circle cx="25" cy="35" r="3" fill="#e9bf80"/><path d="M43 34h10m-10 3h7" stroke="#c9aa8a" strokeWidth="1.4"/>
  </>}
  {kind==='ball'&&<>
   <circle cx="36" cy="36" r="22" fill="#ead0a6" stroke={ink} strokeWidth="2"/>
   <path d="M36 14q-13 11-8 24L13 42q3 10 12 14 4-14 15-16 10-1 18 7 2-5 0-12-12 2-19-6Q34 22 36 14Z" fill="#b7c9b1"/>
   <path d="M36 14q5 12 3 15m-11 9q7 0 12 2M25 56q0-9 3-18m30-3q-10 0-18 5" stroke="#fff8e8" strokeWidth="1.5" fill="none"/>
   <circle cx="36" cy="36" r="21" fill="none" stroke="#9f7c62" strokeWidth="1.5"/>
  </>}
 </svg>;
}

export function PlantIllustration({stage,...place}:{stage:number}&Place){
 const growth=Math.max(0,Math.min(4,stage));
 return <svg viewBox="0 0 72 76" aria-hidden="true" focusable="false" {...place}>
  <ellipse cx="36" cy="70" rx="23" ry="4" fill="#6e503b" opacity=".13"/>
  <path d="M22 47h28l-4 20q-10 4-20 0Z" fill="#c78e6d" stroke="#9e6b50" strokeWidth="1.5"/>
  <path d="M20 45h32v6H20Z" fill="#deaa81" stroke="#9e6b50" strokeWidth="1.5"/>
  <path d="M27 55q9 3 18 0" stroke="#f4d2af" strokeWidth="1.4" fill="none"/>
  <path d="M36 46V20" stroke="#688961" strokeWidth="2.3" strokeLinecap="round"/>
  <path d="M35 36Q19 19 15 32q3 12 20 9ZM37 33Q53 16 57 29q-2 12-20 10Z" fill="#8fb78d" stroke="#628861" strokeWidth="1.5"/>
  {growth>=1&&<path d="M36 27Q27 10 23 20q-1 9 13 12ZM38 25Q47 7 54 17q2 9-16 14Z" fill="#a7c9a0" stroke="#628861" strokeWidth="1.5"/>}
  {growth>=2&&<path d="M36 22Q28 2 33 5q10 1 6 20Z" fill="#79a879" stroke="#628861" strokeWidth="1.5"/>}
  {growth>=3&&<><path d="M36 15V7" stroke="#688961" strokeWidth="2"/><circle cx="36" cy="7" r="5" fill="#efd6bd"/><circle cx="36" cy="7" r="2" fill="#d9ab72"/></>}
  {growth>=4&&<><circle cx="25" cy="18" r="3" fill="#f6d6c9"/><circle cx="49" cy="16" r="3" fill="#f6d6c9"/></>}
 </svg>;
}

export function SeasonIllustration({season,...place}:{season:Season}&Place){
 return <svg viewBox="0 0 88 62" aria-hidden="true" focusable="false" {...place}>
  <rect x="2" y="2" width="84" height="58" rx="4" fill="#b48e69"/>
  <rect x="7" y="7" width="74" height="48" rx="2" fill={season==='winter'?'#dbe7e9':season==='summer'?'#b7dce1':'#e6e8d5'}/>
  <circle cx="65" cy="19" r="8" fill={season==='winter'?'#fffaf1':'#f8d790'}/>
  <path d="M8 44Q26 29 43 43T80 40V55H8Z" fill={season==='winter'?'#fff8ed':season==='autumn'?'#bb9d75':'#a8c4a3'}/>
  <path d="M8 50q15-12 32 1t40-4v8H8Z" fill={season==='winter'?'#f5f7f1':season==='autumn'?'#d1a16c':'#83aa86'}/>
  <path d="M22 51V22m0 10-10-8m10 4 10-10" stroke="#8c755a" strokeWidth="2.4" strokeLinecap="round"/>
  {season==='spring'&&<g fill="#efbdc1"><circle cx="12" cy="22" r="3"/><circle cx="31" cy="18" r="3"/><circle cx="24" cy="12" r="3"/><circle cx="36" cy="24" r="2"/></g>}
  {season==='summer'&&<g fill="#6caa74"><ellipse cx="12" cy="22" rx="5" ry="3"/><ellipse cx="28" cy="17" rx="6" ry="4"/><ellipse cx="24" cy="11" rx="4" ry="3"/><ellipse cx="35" cy="24" rx="4" ry="3"/></g>}
  {season==='autumn'&&<g fill="#cf8654"><ellipse cx="12" cy="22" rx="4" ry="3"/><ellipse cx="28" cy="17" rx="5" ry="3"/><ellipse cx="23" cy="11" rx="4" ry="3"/><ellipse cx="35" cy="25" rx="3" ry="3"/><ellipse cx="31" cy="48" rx="3" ry="2"/></g>}
  {season==='winter'&&<g fill="#fffaf0"><circle cx="17" cy="19" r="2"/><circle cx="34" cy="28" r="1.7"/><circle cx="52" cy="32" r="2"/><circle cx="72" cy="45" r="1.7"/></g>}
  {season==='plain'&&<g fill="#f5e7b6"><circle cx="13" cy="22" r="2.6"/><circle cx="32" cy="21" r="2.6"/><circle cx="49" cy="48" r="2.4"/></g>}
 </svg>;
}

function RugIllustration(place:Place){return <svg viewBox="0 0 96 54" aria-hidden="true" focusable="false" {...place}><ellipse cx="48" cy="28" rx="42" ry="21" fill="#d49c85" stroke="#9d705e" strokeWidth="2"/><ellipse cx="48" cy="28" rx="34" ry="15" fill="#e9c8aa" stroke="#fff0d8" strokeWidth="2"/><path d="M48 16 62 28 48 40 34 28Z" fill="#b6bda2" stroke="#9d705e" strokeWidth="1.5"/><path d="M48 21 56 28 48 35 40 28Z" fill="#f8e7ca"/><path d="M18 20 11 18m7 17-7 3m67-18 7-2m-7 17 7 3" stroke="#bf9d7d" strokeWidth="2" strokeLinecap="round"/></svg>}

function ChoiceRoom({wall='#f3e7d7',floor='wood',weather='sun',light='morning',season='plain',focus='furniture',children}:{wall?:string;floor?:RoomDesign['floor'];weather?:Weather;light?:Light;season?:Season;focus?:'furniture'|'window'|'season'|'floor';children?:ReactNode}){
 const night=light==='night';
 return <svg viewBox="0 0 112 82" aria-hidden="true" focusable="false">
  <rect x="2" y="2" width="108" height="78" rx="9" fill={night?'#d8dddf':light==='evening'?'#f1ded0':wall}/>
  <path d="M3 59h106v20H3Z" fill={floor==='meadow'?'#b9cda7':night?'#c6c3b8':'#dfc5a8'}/>
  <path d="M3 59h106" stroke="#b89d82" strokeWidth="2"/>
  {floor==='meadow'?<><path d="m15 73 3-9 3 9m19 3 3-8 3 8m42-4 3-8 3 8" stroke="#87a776" strokeWidth="1.4"/><circle cx="36" cy="72" r="2" fill="#fff3cf"/><circle cx="79" cy="75" r="2" fill="#f1c9c2"/></>:<path d="M3 68h106M28 60v8m32 0v11m29-19v8" stroke="#c9ac8c" strokeWidth="1" opacity=".8"/>}
  {floor==='rug'&&<RugIllustration x={22} y={55} width={77} height={27}/>}
  <WindowIllustration weather={weather} light={light} season={season} x={focus==='window'?27:10} y={focus==='window'?7:11} width={focus==='window'?54:39} height={focus==='window'?57:43}/>
  {focus!=='window'&&<SeasonIllustration season={season} x={focus==='season'?56:61} y={focus==='season'?10:14} width={focus==='season'?47:35} height={focus==='season'?36:27}/>}
  {focus==='window'&&<path d="M89 15v20m-10 0q10-20 20 0Z" fill="#e7c698" stroke="#a88e6e" strokeWidth="1.4"/>}
  <PlantIllustration stage={season==='spring'?3:1} x={focus==='window'?4:5} y={focus==='window'?51:47} width={focus==='window'?31:35} height={focus==='window'?30:35}/>
  {children}
  {night&&<ellipse cx="85" cy="49" rx="24" ry="17" fill="#ffe7ac" opacity=".1"/>}
 </svg>;
}

export function RoomChoiceIllustration({category,value}:{category:ChoiceCategory;value:string}){
 if(category==='furniture')return <ChoiceRoom><FurnitureIllustration kind={value as Furniture} x={51} y={37} width={58} height={45}/></ChoiceRoom>;
 if(category==='weather')return <ChoiceRoom weather={value as Weather} focus="window"><FurnitureIllustration kind="cushion" x={77} y={56} width={32} height={24}/></ChoiceRoom>;
 if(category==='season')return <ChoiceRoom season={value as Season} focus="season"><FurnitureIllustration kind="book" x={67} y={58} width={35} height={22}/></ChoiceRoom>;
 if(category==='light')return <ChoiceRoom light={value==='auto'?'morning':value as Light} focus="window"><FurnitureIllustration kind="cushion" x={76} y={56} width={32} height={24}/></ChoiceRoom>;
 if(category==='floor')return <ChoiceRoom floor={value as RoomDesign['floor']} focus="floor"><FurnitureIllustration kind="cushion" x={75} y={58} width={30} height={22}/></ChoiceRoom>;
 const wall={warm:'#f3e2d0',leaf:'#e5ead8',sky:'#dcebf0',clear:'#f7f5eb'}[value]||'#f3e2d0';
 return <svg viewBox="0 0 96 72" aria-hidden="true" focusable="false"><rect x="3" y="4" width="90" height="63" rx="8" fill={wall}/><path d="M4 52h88v14H4Z" fill={value==='leaf'?'#d0d8bb':value==='sky'?'#c7dce0':'#ddc8ad'}/><rect x="12" y="13" width="33" height="32" rx="3" fill="#bd9975"/><rect x="16" y="17" width="25" height="24" fill="#b8d9d8"/><path d="M16 36q12-12 25 0v5H16Z" fill="#8eaf93"/><path d="M28 17v24M16 29h25" stroke="#fff1dc" strokeWidth="2"/><ellipse cx="70" cy="59" rx="15" ry="3" fill="#bc9e86" opacity=".5"/><path d="M61 52q0-13 9-13t9 13q0 5-9 5t-9-5Z" fill="#d4a88a"/><path d="M70 43q-14-13-13-4 2 5 13 8m0-8q10-13 13-5 1 6-13 13" fill="#8cae87" stroke="#70936f" strokeWidth="1.5"/>{value==='clear'&&<path d="M4 5h88" stroke="#777568" strokeWidth="2"/>}</svg>;
}

export { RugIllustration };
