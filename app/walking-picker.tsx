'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { WalkingEntry } from '@/lib/walking';
import { WeightWheel } from './weight-wheel';

const minutes = Array.from({ length: 1441 }, (_, index) => index);
type Props = {
  value: string; included: boolean; previous?: WalkingEntry; disabled?: boolean; optional?: boolean;
  onChange: (value: string) => void; onIncludedChange: (included: boolean) => void;
};

export function WalkingPicker({ value, included, previous, disabled = false, optional = true, onChange, onIncludedChange }: Props) {
  const parsed = value.trim() === '' ? NaN : Number(value);
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 1440;
  const current = valid ? parsed : previous?.walkingMinutes ?? 0;
  function change(next: string) { onChange(next); onIncludedChange(true); }

  return <fieldset className={'weight-picker walking-picker ' + (optional ? '' : 'weight-picker-only')} disabled={disabled}>
    {optional && <><legend>ウォーキング時間 <span className="subtle">任意</span></legend>
      <label className="weight-include"><Checkbox aria-label="この日のウォーキング時間を記録する" checked={included} onCheckedChange={checked => onIncludedChange(checked === true)} />この日のウォーキング時間を記録する</label></>}
    <div className="weight-wheels walking-wheels">
      <div className="weight-wheel-selection" aria-hidden="true" />
      <WeightWheel label="ウォーキング時間（分）" values={minutes} value={current} disabled={disabled} onChange={next => change(String(next))} />
      <span className="weight-wheel-unit" aria-hidden="true">分</span>
    </div>
    <output className="sr-only" aria-live="polite" aria-label="入力するウォーキング時間">{current}分</output>
    {previous && <Button type="button" className="weight-reset" variant="ghost" onClick={() => change(String(previous.walkingMinutes))}><RotateCcw size={14} />前回の時間に戻す</Button>}
    <details className="weight-direct"><summary>分数を直接入力する</summary><label className="sr-only" htmlFor="walking-direct">ウォーキング時間を直接入力（分）</label><Input id="walking-direct" type="text" inputMode="numeric" value={value} placeholder="例：30" onChange={event => change(event.target.value)} /></details>
    {!valid && included && <p className="form-error" role="alert">ウォーキング時間は0〜1440分の整数で入力してください。</p>}
    {optional && !included && <p className="weight-not-included">この日のウォーキング時間は保存しません。</p>}
  </fieldset>;
}
