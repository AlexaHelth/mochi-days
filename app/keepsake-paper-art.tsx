import type { ReactNode } from 'react';

/** Details drawn inside the shared 96 × 96 keepsake SVG. */
export function paperArt(label: string): ReactNode | null {
  switch (label) {
    case 'パンの形の栞':
      return <>
        <path d="M49 13q-4-6-8-2m8 2 1 9" fill="none" stroke="#9b7761" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M48 12q6 4 9 10l-7 1-6-5Z" fill="#8da88d" stroke="#64856c" strokeWidth="1.5"/>
        <path d="M25 39q-2-16 10-20 8-3 14 2 8-5 16-1 11 5 8 20v31L49 82 25 71Z" fill="#ba7952" stroke="#885c49" strokeWidth="2.3" strokeLinejoin="round"/>
        <path d="M31 41q-2-12 7-15 6-2 11 3 6-5 12-3 8 3 6 15v26L49 75 31 67Z" fill="#f7dfaa" stroke="#e3b87e" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M34 43q6-4 13-1m6 0q6-3 11 1M34 65l15 7 15-7" fill="none" stroke="#fff1cd" strokeWidth="2" strokeLinecap="round"/>
        <path d="m40 50 2-3m8 6 2-3m7 5 2-3" stroke="#b98e61" strokeWidth="2.5" strokeLinecap="round"/>
      </>;

    case '絵本の小さな表紙':
      return <>
        <path d="M25 19h49v59H26q-6 0-6-6V26q0-7 5-7Z" fill="#f8e9d1" stroke="#9b7666" strokeWidth="2"/>
        <path d="M23 17h45q5 0 5 5v50q0 5-5 5H23q-4 0-4-5V22q0-5 4-5Z" fill="#b37f76" stroke="#865f5d" strokeWidth="2"/>
        <path d="M26 18v58m4-58v58" stroke="#e6b9a5" strokeWidth="2"/>
        <rect x="35" y="24" width="30" height="44" rx="11" fill="#e7eacb" stroke="#f8ddbb" strokeWidth="1.6"/>
        <circle cx="52" cy="39" r="9" fill="#f9e1a4"/>
        <path d="M39 55q9-14 23-5v12H38Z" fill="#8caa8e"/>
        <path d="M45 57q1-7 6-8 6 0 7 8Z" fill="#d9a881" stroke="#a37660" strokeWidth="1"/>
        <path d="M47 49q-3-9 0-10 5 0 5 10m2 0q2-10 5-10 3 2-2 11" fill="#d9a881" stroke="#a37660" strokeWidth="1" strokeLinejoin="round"/>
        <circle cx="40" cy="31" r="1.4" fill="#fff8e9"/><circle cx="61" cy="34" r="1.3" fill="#fff8e9"/>
      </>;

    case '灯台のしおり':
      return <>
        <path d="M49 13v9m0-9q6-2 9 4" fill="none" stroke="#a6816f" strokeWidth="2" strokeLinecap="round"/>
        <path d="M29 22h40v59L49 72 29 81Z" fill="#f6e8ca" stroke="#9b846c" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M34 27h30v45l-15-7-15 7Z" fill="#b7d4d4"/>
        <path d="M39 68q9-6 20 0m-23 4q13-7 27 0" fill="none" stroke="#649ba4" strokeWidth="3" strokeLinecap="round"/>
        <path d="m42 62 2-29h10l2 29Z" fill="#fff4df" stroke="#9e7466" strokeWidth="1.8"/>
        <path d="M43 47h12l-1 7H42Z" fill="#c98272"/>
        <path d="M40 32h18l-3-5H43Z" fill="#c98272" stroke="#9e7466" strokeWidth="1.5"/>
        <path d="M45 30v-7h8v7" fill="#f5dfa9" stroke="#9e7466" strokeWidth="1.5"/>
        <path d="M46 40h6" stroke="#e7bd7c" strokeWidth="3" strokeLinecap="round"/>
      </>;

    case '雲のしおり':
      return <>
        <path d="M49 11v12m0-12q6-3 8 4" fill="none" stroke="#8b9996" strokeWidth="2" strokeLinecap="round"/>
        <path d="M28 22h42v59L49 71 28 81Z" fill="#afcbd0" stroke="#769ba2" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M33 27h32v44l-16-7-16 7Z" fill="#dce9df"/>
        <circle cx="58" cy="38" r="7" fill="#efce8f"/>
        <path d="M33 52q-1-7 7-8 2-10 11-10 8 0 10 8 8 0 8 8 0 7-8 7H40q-7 0-7-5Z" fill="#fff8ed" stroke="#9db7b7" strokeWidth="1.8"/>
        <path d="M39 60q8 2 18 0" fill="none" stroke="#a4c9ce" strokeWidth="2" strokeLinecap="round"/>
      </>;

    case '森の小さな手紙':
      return <>
        <path d="M27 19h40v43H27Z" fill="#fff1d9" stroke="#a38a70" strokeWidth="1.6"/>
        <path d="M46 25 35 47h22Z" fill="#76977d"/><path d="M49 22 38 43h22Z" fill="#62866f"/>
        <path d="M49 40v12m-5-5h10" stroke="#8f765b" strokeWidth="2" strokeLinecap="round"/>
        <path d="M32 55h27" stroke="#d6bda0" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 41 48 57l30-16v33q-30 12-60 0Z" fill="#b7c8aa" stroke="#738c74" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M18 41 48 61l30-20" fill="none" stroke="#6f8a74" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M18 74 47 55 78 74" fill="#d7dfbd" stroke="#738c74" strokeWidth="1.7" strokeLinejoin="round"/>
        <circle cx="48" cy="63" r="5" fill="#ba886c"/><path d="m46 64 2-4 2 4" fill="none" stroke="#f7e9cf" strokeWidth="1.3"/>
      </>;

    case 'パン屋の小さなカード':
      return <>
        <path d="M22 22h53v56H22q-4 0-4-4V26q0-4 4-4Z" fill="#f8edda" stroke="#9d8069" strokeWidth="2"/>
        <path d="M22 22v56m5-56v56" stroke="#d7c3a9" strokeWidth="1.5"/>
        <path d="M34 34h34v35H34Z" fill="#d5e0ca" stroke="#a8a78b" strokeWidth="1.5"/>
        <path d="M33 31h36l-3 13q-4 4-8 0-4 4-8 0-4 4-8 0-4 4-8 0Z" fill="#cb826f" stroke="#9d6b60" strokeWidth="1.5"/>
        <path d="M39 31v13m10-13v13m10-13v13" stroke="#fff0d6" strokeWidth="5"/>
        <path d="M39 63V47h24v16" fill="#f8ebd1" stroke="#a08b70" strokeWidth="1.5"/>
        <path d="M42 58q0-7 7-8 7 1 7 8Z" fill="#c99363" stroke="#9d704f" strokeWidth="1.5"/>
        <path d="M48 51q-2 3-1 6m5-6q-2 3-1 6" stroke="#f4d5a5" strokeWidth="1.5" strokeLinecap="round"/>
      </>;

    case '海色の手紙':
      return <>
        <path d="M24 32 16 44v31q28 14 64 0V44L68 32Z" fill="#9ebcc2" stroke="#698f9a" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M25 19h45v51H25Z" fill="#e4f0e9" stroke="#769ca0" strokeWidth="1.8"/>
        <path d="M26 50q10-11 21 0 10-10 22 0v18H26Z" fill="#76aebc"/>
        <path d="M26 57q12-8 22 0 11-8 21 0m-36 8q7-4 13 0m8 0q6-4 11 0" fill="none" stroke="#d9ede7" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M32 29h20m-20 6h15" stroke="#8dadac" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="60" cy="32" r="6" fill="#f9e8c9"/><path d="M57 34q3-7 6 0m-5-2 2 4 2-4" fill="none" stroke="#b79472" strokeWidth="1.1"/>
        <path d="m16 44 32 23 32-23v31q-31 13-64 0Z" fill="#a6c9cd" stroke="#698f9a" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M16 75 46 55l34 20" fill="none" stroke="#dceee7" strokeWidth="2"/>
      </>;

    default:
      return null;
  }
}
