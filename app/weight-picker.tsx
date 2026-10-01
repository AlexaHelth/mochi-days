'use client';

import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { adjustWeight, weightChange, weightDate, type WeightEntry } from '@/lib/weight';

type Props = {
  value: string;
  included: boolean;
  previous?: WeightEntry;
  disabled?: boolean;
  onChange: (value: string) => void;
  onIncludedChange: (included: boolean) => void;
};

export function WeightPicker({ value, included, previous, disabled = false, onChange, onIncludedChange }: Props) {
  const parsed = value.trim() === '' ? NaN : Number(value);
  const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= 500;
  const current = valid ? parsed : previous?.weight ?? 60;
  const anchor = previous?.weight ?? 60;
  const span = previous ? 5 : 40;
  const minimum = Math.max(1, Math.min(anchor - span, current));
  const maximum = Math.min(500, Math.max(anchor + span, current));

  function change(next: string) {
    onChange(next);
    onIncludedChange(true);
  }

  return <fieldset className={'weight-picker ' + (included ? 'included' : '')} disabled={disabled}>
    <legend>体重 <span className="subtle">任意</span></legend>
    <label className="weight-include">
      <Checkbox aria-label="この日の体重を記録する" checked={included} onCheckedChange={checked => onIncludedChange(checked === true)} />
      この日の体重を記録する
    </label>
    <p className="weight-reference">{previous
      ? `前回 ${previous.weight.toFixed(1)} kg · ${weightDate(previous.day)}の記録`
      : 'はじめての体重は、目盛りやボタンで合わせてね。'}</p>
    <div className="weight-stepper">
      <Button type="button" variant="outline" aria-label="体重を0.1 kg減らす" disabled={current <= 1} onClick={() => change(adjustWeight(current, -1).toFixed(1))}><Minus /><small>0.1</small></Button>
      <output className="weight-picker-value" aria-live="polite" aria-label="入力する体重">{current.toFixed(1)}<span>kg</span></output>
      <Button type="button" variant="outline" aria-label="体重を0.1 kg増やす" disabled={current >= 500} onClick={() => change(adjustWeight(current, 1).toFixed(1))}><Plus /><small>0.1</small></Button>
    </div>
    <p className="weight-difference" aria-live="polite">{previous ? weightChange(current, previous.weight) : '最初の記録になります'}</p>
    <label className="weight-scale-label" htmlFor="weight-scale">目盛りを動かして調整</label>
    <input id="weight-scale" className="weight-scale" type="range" min={minimum} max={maximum} step="0.1" value={current} aria-valuetext={`${current.toFixed(1)} kg`} onChange={event => change(Number(event.target.value).toFixed(1))} />
    <div className="weight-scale-ends" aria-hidden="true"><span>{minimum.toFixed(1)} kg</span><span>{maximum.toFixed(1)} kg</span></div>
    <div className="weight-coarse">
      <Button type="button" variant="ghost" aria-label="体重を1 kg減らす" disabled={current <= 1} onClick={() => change(adjustWeight(current, -10).toFixed(1))}>− 1.0 kg</Button>
      {previous && <Button type="button" variant="ghost" onClick={() => change(String(previous.weight))}><RotateCcw size={14} />前回の値</Button>}
      <Button type="button" variant="ghost" aria-label="体重を1 kg増やす" disabled={current >= 500} onClick={() => change(adjustWeight(current, 10).toFixed(1))}>＋ 1.0 kg</Button>
    </div>
    <details className="weight-direct"><summary>数値を直接入力する</summary><label className="sr-only" htmlFor="weight-direct">体重を直接入力（kg）</label><Input id="weight-direct" type="text" inputMode="decimal" value={value} placeholder="例：60.0" onChange={event => change(event.target.value)} /></details>
    {!valid && included && <p className="form-error" role="alert">体重は1〜500 kgの範囲で入力してください。</p>}
    {!included && <p className="weight-not-included">この日の体重は保存しません。メモや気分だけでも保存できます。</p>}
  </fieldset>;
}
