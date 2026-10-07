'use client';
import { GiftPackageArt, KeepsakeIllustration, kindForLabel } from './keepsake-illustrations';

export function KeepsakeArt({label,id,small=false}:{label:string;id?:string;small?:boolean}) {
  const kind=kindForLabel(label);
  return <span className={'keepsake-art keepsake-'+kind+(small?' keepsake-small':'')} role="img" aria-label={label}><KeepsakeIllustration kind={kind} label={label} id={id}/></span>;
}

export { GiftPackageArt };
