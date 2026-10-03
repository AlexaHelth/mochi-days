'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function slicePage<T>(items:readonly T[],requested:number,size:number){
 const pages=Math.max(1,Math.ceil(items.length/size)),page=Math.min(Math.max(0,requested),pages-1);
 return {items:items.slice(page*size,(page+1)*size),page,pages,total:items.length,start:page*size+1,end:Math.min(items.length,(page+1)*size)};
}
export function CollectionPager({page,pages,total,start,end,onChange,label}:{page:number;pages:number;total:number;start:number;end:number;onChange:(page:number)=>void;label:string}){
 if(!total)return null;
 return <nav className="collection-pager" aria-label={label+'のページ'}><Button type="button" variant="outline" disabled={page===0} aria-label={label+'の前のページ'} onClick={()=>onChange(page-1)}><ChevronLeft size={18}/></Button><span aria-live="polite"><strong>{start===end?start:`${start}–${end}`}</strong> / {total}<small>{pages>1?`${page+1} / ${pages}ページ`:''}</small></span><Button type="button" variant="outline" disabled={page===pages-1} aria-label={label+'の次のページ'} onClick={()=>onChange(page+1)}><ChevronRight size={18}/></Button></nav>;
}
