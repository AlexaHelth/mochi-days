'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { weightChange, weightDate, type WeightEntry } from '@/lib/weight';
import { WeightWheel } from './weight-wheel';

const kilograms = Array.from({ length: 500 }, (_, index) => index + 1);
const tenths = Array.from({ length: 10 }, (_, index) => index);
const zero = [0];

type Props = {
  value: string;
  included: boolean;
  previous?: WeightEntry;
  disabled?: boolean;
  optional?: boolean;
  onChange: (value: string) => void;
  onIncludedChange: (included: boolean) => void;
};

export function WeightPicker({ value, included, previous, disabled = false, optional = true, onChange, onIncludedChange }: Props) {
  const parsed = value.trim() === '' ? NaN : Number(value);
  const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= 500;
  const current = valid ? parsed : previous?.weight ?? 60;
  const rounded = Math.round(current * 10);
  const whole = Math.floor(rounded / 10), fraction = rounded % 10;

  function change(next: string) {
    onChange(next);
    onIncludedChange(true);
  }

  return <fieldset className={'weight-picker ' + (optional ? '' : 'weight-picker-only')} disabled={disabled}>
    {optional && <><legend>体重 <span className="subtle">任意</span></legend>
    <label className="weight-include">
      <Checkbox aria-label="この日の体重を記録する" checked={included} onCheckedChange={checked => onIncludedChange(checked === true)} />
      この日の体重を記録する
    </label></>}
    <p className="weight-reference">{previous
      ? `前回 ${previous.weight.toFixed(1)} kg · ${weightDate(previous.day)}の記録`
      : 'はじめての体重を選んでね。'}</p>
    <div className="weight-wheels">
      <div className="weight-wheel-selection" aria-hidden="true" />
      <WeightWheel label="体重の整数（kg）" values={kilograms} value={whole} disabled={disabled} onChange={next => change((next === 500 ? 500 : next + fraction / 10).toFixed(1))} />
      <span className="weight-wheel-dot" aria-hidden="true">.</span>
      <WeightWheel label="体重の小数（0.1 kg）" values={whole === 500 ? zero : tenths} value={fraction} disabled={disabled || whole === 500} onChange={next => change((whole + next / 10).toFixed(1))} />
      <span className="weight-wheel-unit" aria-hidden="true">kg</span>
    </div>
    <output className="sr-only" aria-live="polite" aria-label="入力する体重">{current.toFixed(1)} kg</output>
    <p className="weight-difference" aria-live="polite">{previous ? weightChange(current, previous.weight) : '最初の記録になります'}</p>
    {previous && <Button type="button" className="weight-reset" variant="ghost" onClick={() => change(String(previous.weight))}><RotateCcw size={14} />前回の値に戻す</Button>}
    <details className="weight-direct"><summary>数値を直接入力する</summary><label className="sr-only" htmlFor="weight-direct">体重を直接入力（kg）</label><Input id="weight-direct" type="text" inputMode="decimal" value={value} placeholder="例：60.0" onChange={event => change(event.target.value)} /></details>
    {!valid && included && <p className="form-error" role="alert">体重は1〜500 kgの範囲で入力してください。</p>}
    {optional && !included && <p className="weight-not-included">この日の体重は保存しません。メモや気分だけでも保存できます。</p>}
  </fieldset>;
}
