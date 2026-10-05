'use client';
import { GiftPackageArt, KeepsakeIllustration, kindForLabel } from './keepsake-illustrations';

export function KeepsakeArt({label,small=false}:{label:string;small?:boolean}) {
  const kind=kindForLabel(label);
  return <span className={'keepsake-art keepsake-'+kind+(small?' keepsake-small':'')} role="img" aria-label={label}><KeepsakeIllustration kind={kind}/></span>;
}

export { GiftPackageArt };
