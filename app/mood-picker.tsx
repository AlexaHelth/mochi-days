'use client';
import { RadioGroup } from 'radix-ui';
import { Smile, Meh, Moon, Check } from 'lucide-react';

const choices = [{label:'元気！',Icon:Smile},{label:'ふつう',Icon:Meh},{label:'おつかれ',Icon:Moon}];
export function MoodPicker({value,onChange,disabled=false}:{value:number|null;onChange:(value:number)=>void;disabled?:boolean}) {
  return <RadioGroup.Root className="mood-options mood-picker" aria-label="気分" value={value===null?'':String(value)} onValueChange={next=>onChange(Number(next))} disabled={disabled}>
    {choices.map(({label,Icon},index)=><RadioGroup.Item key={label} value={String(index)} className={'mood-option '+(value===index?'selected':'')} aria-label={label}>
      <Icon size={28}/><span>{label}</span>{value===index&&<Check size={16} className="mood-selected-check" aria-hidden="true"/>}
    </RadioGroup.Item>)}
  </RadioGroup.Root>;
}
