'use client';
import { feelings, dayTags } from '@/lib/companion-content';
import type { Entry } from '@/lib/mochi';
import { Button } from '@/components/ui/button';
export function EntryDetails({entry,onChange,disabled=false}:{entry:Entry;onChange:(entry:Entry)=>void;disabled?:boolean}){
 return <div className="entry-details">{([{key:'feelings',title:'今の気分を、言葉で',options:feelings},{key:'tags',title:'今日を表す、小さなタグ',options:dayTags}] as const).map(group=><fieldset key={group.key}><legend>{group.title}<small>任意・3つまで</small></legend><div className="tag-choices">{group.options.map(text=>{const selected=entry[group.key]?.includes(text)??false;return <Button type="button" variant={selected?'secondary':'outline'} key={text} aria-pressed={selected} disabled={disabled||(!selected&&(entry[group.key]?.length??0)>=3)} onClick={()=>onChange({...entry,[group.key]:selected?entry[group.key]!.filter(value=>value!==text):[...(entry[group.key]??[]),text]})}>{text}</Button>})}</div></fieldset>)}</div>;
}
