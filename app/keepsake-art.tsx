'use client';
import { Flower2, Leaf, Shell, BookOpen, Mail, Star, Bell, KeyRound, Coffee, CloudRain, Circle, Ribbon, Sprout } from 'lucide-react';

export function KeepsakeArt({label,small=false}:{label:string;small?:boolean}) {
  const kind=/花|一輪/.test(label)?'flower':/貝/.test(label)?'shell':/葉|木の実/.test(label)?'leaf':/手紙|カード/.test(label)?'letter':/栞|しおり|絵本|表紙/.test(label)?'book':/毛糸|毛布|糸/.test(label)?'wool':/瓶|カップ|茶|コースター/.test(label)?'cup':/鈴/.test(label)?'bell':/鍵/.test(label)?'key':/リボン/.test(label)?'ribbon':/種/.test(label)?'seed':/雨|しずく/.test(label)?'rain':/小石|石/.test(label)?'stone':'star';
  const Icon={flower:Flower2,shell:Shell,leaf:Leaf,letter:Mail,book:BookOpen,wool:Circle,cup:Coffee,bell:Bell,key:KeyRound,ribbon:Ribbon,seed:Sprout,rain:CloudRain,stone:Circle,star:Star}[kind];
  return <span className={'keepsake-art keepsake-'+kind+(small?' keepsake-small':'')} role="img" aria-label={label}><Icon strokeWidth={1.6}/>{kind==='flower'&&<span className="keepsake-stem"/>}{kind==='wool'&&<span className="keepsake-thread"/>}</span>;
}
