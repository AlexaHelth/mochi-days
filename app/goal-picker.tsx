'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { goalOptions, goalSelection } from '@/lib/goals';
import { WeightWheel } from './weight-wheel';

const choices=goalOptions.map((_,index)=>index);

export function GoalPicker({value,onChange,disabled=false}:{value:string;onChange:(value:string)=>void;disabled?:boolean}){
  const id=useId();
  const [selection,setSelection]=useState(()=>goalSelection(value));
  const [customText,setCustomText]=useState(()=>goalSelection(value)===choices.length-1?value:'');
  const selected=goalOptions[selection];
  function choose(index:number){
    setSelection(index);
    onChange(goalOptions[index].id==='custom'?customText:goalOptions[index].text);
  }
  return <section className="goal-picker" aria-label="ゆるい目標の設定">
    <p className="field-label">あなたの、ゆるい目標</p>
    <p className="weight-scroll-hint">上下にスクロールして選んでね</p>
    <div className="goal-wheel">
      <span className="weight-wheel-selection" aria-hidden="true"/>
      <WeightWheel label="目標を選ぶ" values={choices} value={selection} disabled={disabled} onChange={choose} formatValue={index=>goalOptions[index].label}/>
    </div>
    <div className="goal-preview" aria-live="polite">
      {selected.id!=='custom'&&selected.text&&<strong>{selected.text}</strong>}
      <p>{selected.description}</p>
      {'source' in selected&&<a href={selected.source} target="_blank" rel="noreferrer">がん予防について知る</a>}
    </div>
    {selected.id==='custom'&&<div className="custom-goal">
      <label className="field-label" htmlFor={id}>自分の目標 <span className="subtle">80文字まで</span></label>
      <Input id={id} value={customText} required pattern={'.*\\S.*'} title="目標を入力してね" maxLength={80} disabled={disabled} placeholder="例：休日に、もちと15分のおさんぽ" onChange={event=>{setCustomText(event.target.value);onChange(event.target.value)}}/>
    </div>}
  </section>;
}
