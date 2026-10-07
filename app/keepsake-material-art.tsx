import type { ReactNode } from 'react';

// These pieces are drawn inside the 96 × 96 KeepsakeIllustration SVG.
// The broad silhouettes remain different when the same art is shown at 32 px in the room.
export function materialArt(label:string):ReactNode|null {
 switch(label){
  case '白い貝がら':
   return <g>
    <path d="M16 61Q20 39 35 28q12-8 25 0 17 10 20 33Q67 76 48 79 29 76 16 61Z" fill="#f7f0df" stroke="#a99483" strokeWidth="2.5"/>
    <path d="M48 76 24 45m24 31L34 31m14 45V25m0 51 14-45M48 76l25-31" fill="none" stroke="#d7c4af" strokeWidth="3.6" strokeLinecap="round"/>
    <path d="M48 75 25 49m23 26L36 35m12 40V30m0 45 12-40m-12 40 23-26" fill="none" stroke="#fffdf5" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 60q26 13 54 0" fill="none" stroke="#bfae9b" strokeWidth="2"/>
    <path d="M42 74q6 7 12 0" fill="#dfc7ac" stroke="#a99483" strokeWidth="1.5"/>
   </g>;

  case 'しましまの貝':
   return <g>
    <path d="M19 62q6-13 22-25Q57 25 78 21q-2 25-14 40Q49 79 30 73q-9-2-11-11Z" fill="#f5d6b1" stroke="#9c725e" strokeWidth="2.5"/>
    <path d="M34 45q10 4 13 18m1-30q12 5 15 17m-2-24q10 3 12 10" fill="none" stroke="#b67461" strokeWidth="7" strokeLinecap="round"/>
    <path d="M34 45q10 4 13 18m1-30q12 5 15 17m-2-24q10 3 12 10" fill="none" stroke="#f9e8cf" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 62q15-5 27 2Q38 78 28 73q-9-4-9-11Z" fill="#f8e9d7" stroke="#9c725e" strokeWidth="2"/>
    <path d="M27 64q10-4 12 3-6 7-12 2" fill="none" stroke="#bf9380" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M74 23q1 13-3 21" fill="none" stroke="#fff1dc" strokeWidth="2" strokeLinecap="round"/>
   </g>;

  case 'しずくの貝がら':
   return <g>
    <path d="M48 15Q68 35 73 57q4 20-25 24Q19 77 23 57q5-22 25-42Z" fill="#c8e0dc" stroke="#739da3" strokeWidth="2.5"/>
    <path d="M48 23Q32 43 30 58q-1 12 18 16 19-4 18-16-2-15-18-35Z" fill="#f1f3e9" stroke="#8ab0b2" strokeWidth="1.5"/>
    <path d="M48 30q9 18 5 36-2 6-5 8-3-2-5-8-4-18 5-36Z" fill="#88b7bd" stroke="#668f9a" strokeWidth="1.5"/>
    <path d="M48 37v28" stroke="#ddf3ef" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M28 62q4 8 14 10m26-10q-4 8-14 10" fill="none" stroke="#bdd5d0" strokeWidth="2" strokeLinecap="round"/>
   </g>;

  case 'まあるい小石':
   return <g>
    <path d="M47 19q19-1 28 17 10 19-3 33-10 12-28 11Q23 78 19 60q-4-18 10-32 7-8 18-9Z" fill="#b8c3b5" stroke="#788f80" strokeWidth="2.5"/>
    <path d="M32 38q8-12 20-11m-24 23q-3 12 5 17" fill="none" stroke="#e3e9d8" strokeWidth="4" strokeLinecap="round"/>
    <path d="M61 31q12 9 12 22m-31 18q10 4 20-2" fill="none" stroke="#90aa96" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="53" cy="39" r="2.5" fill="#8ca594"/><circle cx="66" cy="57" r="1.8" fill="#e1e6d7"/>
   </g>;

  case '砂色の小石':
   return <g>
    <path d="M18 63q8-11 26-11 19-1 30 11 6 7 3 11-5 6-28 6-25 0-30-6-4-5-1-11Z" fill="#d6b187" stroke="#9e7858" strokeWidth="2.5"/>
    <path d="M31 48q6-13 20-16 12 0 17 13 3 7-2 11-14 9-31 0-6-3-4-8Z" fill="#efd3a8" stroke="#aa8764" strokeWidth="2"/>
    <path d="M37 48q6-10 18-10m-28 29q19-7 41 0" fill="none" stroke="#fff0d1" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="29" cy="75" r="1.6" fill="#a88362"/><circle cx="48" cy="71" r="1.4" fill="#f8e6c1"/><circle cx="64" cy="75" r="1.8" fill="#ad8869"/>
   </g>;

  case '雨の絵のコースター':
   return <g>
    <path d="M20 18q-5 0-5 6v48q0 8 7 8h51q8 0 8-8V24q0-7-7-7Z" fill="#8fb2ba" stroke="#618994" strokeWidth="2.5"/>
    <path d="M23 24h50v48H23Z" fill="#dceae4" stroke="#f3f4e9" strokeWidth="1.5"/>
    <path d="M31 46q-2-9 8-12 6-9 15-4 9-2 11 7 9 3 7 11H31Z" fill="#fffaf0" stroke="#93aeb3" strokeWidth="1.5"/>
    <path d="m38 53-3 9m15-9-3 9m16-9-3 9" stroke="#5e9cae" strokeWidth="3" strokeLinecap="round"/>
    <path d="M28 69q20 4 40 0" fill="none" stroke="#adc9c5" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="20" cy="22" r="1.5" fill="#f7f6eb"/><circle cx="76" cy="74" r="1.5" fill="#f7f6eb"/>
   </g>;

  case 'お茶のコースター':
   return <g>
    <circle cx="48" cy="49" r="32" fill="#c8a579" stroke="#8f7254" strokeWidth="2.5"/>
    <circle cx="48" cy="49" r="26" fill="#e9d5ad" stroke="#f5e7ca" strokeWidth="2"/>
    <circle cx="48" cy="49" r="20" fill="#fbf5e6" stroke="#9e8b70" strokeWidth="2"/>
    <circle cx="48" cy="49" r="15" fill="#ad8a60"/>
    <path d="M45 53q-7-8 2-15 9 5 3 14m-5 1q10-10 16-4-4 9-16 4Z" fill="#93a782" stroke="#6f8e6f" strokeWidth="1.5"/>
    <path d="M48 51q6 0 10-2" fill="none" stroke="#e3edce" strokeWidth="1.5"/>
    <path d="M23 48h3m44 0h3M48 24v3m0 44v3" stroke="#fff3d5" strokeWidth="2" strokeLinecap="round"/>
   </g>;

  case 'ふわふわの糸':
   return <g>
    <path d="M30 29q10-5 35 0v39q-17 5-35 0Z" fill="#b98771" stroke="#8d695b" strokeWidth="2"/>
    <path d="M34 33q14-4 27 0v30q-14 5-27 0Z" fill="#f3d9cd" stroke="#b88e83" strokeWidth="1.5"/>
    <path d="M35 38q11 4 26 0m-26 9q13 4 26 0m-26 9q12 4 26 0" fill="none" stroke="#fff2df" strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="48" cy="27" rx="21" ry="6" fill="#dab097" stroke="#8d695b" strokeWidth="2"/>
    <ellipse cx="48" cy="69" rx="21" ry="6" fill="#c8947f" stroke="#8d695b" strokeWidth="2"/>
    <path d="M66 53q17 0 13 13-3 8-13 6-9-1-10 8" fill="none" stroke="#e6c2b9" strokeWidth="4" strokeLinecap="round"/>
    <path d="M72 62q3-5 6-3m-9 9q5-1 7 3" fill="none" stroke="#fff1e5" strokeWidth="2" strokeLinecap="round"/>
   </g>;

  case '冬のやわらかな毛糸':
   return <g>
    <circle cx="47" cy="50" r="28" fill="#c9b8d4" stroke="#8e82a5" strokeWidth="2.5"/>
    <path d="M28 32q22 0 42 23M22 48q26-12 47 11M26 64q22-17 41 2M38 24q-15 29 4 53m9-54q-12 26 7 50" fill="none" stroke="#f2e7ed" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M58 27q-18 29 0 47M30 37q23 5 37 27" fill="none" stroke="#a99aba" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M71 62q12 4 10 15-1 7-11 6" fill="none" stroke="#c9b8d4" strokeWidth="3" strokeLinecap="round"/>
    <path d="M72 17v11m-5-6h10" stroke="#9eb8c1" strokeWidth="2.5" strokeLinecap="round"/>
   </g>;

  case '海辺の毛布':
   return <g>
    <path d="M21 26q21-6 51 1l8 44q-24 12-60 2Z" fill="#8bb9c5" stroke="#5e8c9b" strokeWidth="2.5"/>
    <path d="M21 27q24-5 50 1l3 13q-26-8-52-1Z" fill="#e8e8d6" stroke="#6e9ca6" strokeWidth="1.5"/>
    <path d="M23 47q25-6 53 1m-51 12q24-7 53 1" fill="none" stroke="#f6eee0" strokeWidth="7"/>
    <path d="M23 51q25-6 53 1m-51 12q24-7 53 1" fill="none" stroke="#557f95" strokeWidth="2"/>
    <path d="m24 74 1 8m8-6 1 8m8-7 1 8m8-7 1 8m8-8 1 8m8-10 1 8m8-12 1 8" stroke="#e3e8df" strokeWidth="2" strokeLinecap="round"/>
   </g>;

  case '夕空の小瓶':
   return <g>
    <path d="M38 17h20v14H38Z" fill="#ba9679" stroke="#8c6c59" strokeWidth="2"/>
    <path d="M34 31h28q8 6 8 16v25q0 9-22 9t-22-9V47q0-10 8-16Z" fill="#f2d7c5" fillOpacity=".58" stroke="#8ca5a3" strokeWidth="2.5"/>
    <path d="M29 57q19-7 38 0v15q-19 10-38 0Z" fill="#b58cb3" opacity=".85"/>
    <path d="M30 58q18-6 36 0" fill="none" stroke="#ffe1bc" strokeWidth="3"/>
    <circle cx="49" cy="49" r="9" fill="#f5b078"/>
    <path d="M32 65q14-6 32 0m-31 6q17-5 31 0" fill="none" stroke="#eac8c8" strokeWidth="2" strokeLinecap="round"/>
    <path d="M31 42q1-5 5-7m24 0q5 3 6 8" fill="none" stroke="#fff8e9" strokeWidth="2" strokeLinecap="round"/>
   </g>;

  case '夏の青い小瓶':
   return <g>
    <path d="M41 14h14v13H41Z" fill="#d6b993" stroke="#8e745a" strokeWidth="2"/>
    <path d="M40 27h16v8q10 5 10 16v24q0 7-18 7t-18-7V51q0-11 10-16Z" fill="#a7d5da" fillOpacity=".66" stroke="#548eaa" strokeWidth="2.5"/>
    <path d="M33 51q14-5 30 0v24q-15 8-30 0Z" fill="#4a9cc2" opacity=".87"/>
    <path d="M35 57q6-4 13 0t13 0m-26 9q6-4 13 0t13 0" fill="none" stroke="#e6f4e9" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M39 44q1-5 6-6m9 0q5 1 6 6" fill="none" stroke="#f4f9ed" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="49" cy="47" r="2.5" fill="#f9e4aa"/>
   </g>;

  default:
   return null;
 }
}
