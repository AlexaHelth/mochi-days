'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { pausedTimer, readTimer, timerElapsed, type TimerData } from '@/lib/activity-timer';
import { walkingTimerMinutes } from '@/lib/walking';
import { WeightWheel } from './weight-wheel';

const minutes = Array.from({ length: 1441 }, (_, index) => index);
const emptyTimer: TimerData = { kind: 'walk', seconds: 0, started: null };

export type WalkingPickerHandle = {
  pauseAndGetMinutes: () => number | null;
  resetTimer: () => void;
};

type Props = {
  value: string; included: boolean; scope: string; day: string; disabled?: boolean; optional?: boolean;
  onChange: (value: string) => void; onIncludedChange: (included: boolean) => void;
};

export const WalkingPicker = forwardRef<WalkingPickerHandle, Props>(function WalkingPicker({
  value, included, scope, day, disabled = false, optional = true, onChange, onIncludedChange,
}, ref) {
  const key = 'mochi-days:walking-record-timer:v1:' + encodeURIComponent(scope) + ':' + day;
  const [timer, setTimer] = useState<TimerData>(() => {
    if (typeof window === 'undefined') return emptyTimer;
    try { return readTimer(localStorage.getItem(key)); } catch { return emptyTimer; }
  });
  const [, setTick] = useState(0);
  const running = timer.started !== null;
  const timerUsed = running || timer.seconds > 0;
  const elapsedSeconds = timerElapsed(timer);
  const shownSeconds = Math.floor(elapsedSeconds);
  const parsed = value.trim() === '' ? NaN : Number(value);
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 1440;

  const keep = useCallback((next: TimerData) => {
    setTimer(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key]);

  useEffect(() => {
    if (!running) return;
    const refresh = () => setTick(value => value + 1);
    const interval = setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [running]);

  useEffect(() => {
    if (timerUsed && !included) {
      onChange('0');
      onIncludedChange(true);
    }
  }, [timerUsed, included, onChange, onIncludedChange]);

  useImperativeHandle(ref, () => ({
    pauseAndGetMinutes() {
      if (!timerUsed) return null;
      const stopped = pausedTimer(timer);
      keep(stopped);
      return walkingTimerMinutes(stopped.seconds);
    },
    resetTimer() { keep(emptyTimer); },
  }), [timer, timerUsed, keep]);

  function change(next: number) {
    if (timerUsed) return;
    onChange(String(next));
    onIncludedChange(true);
  }

  function toggle() {
    if (running) {
      keep(pausedTimer(timer));
    } else {
      if (!included) onChange('0');
      onIncludedChange(true);
      keep({ ...timer, started: Date.now() });
    }
  }

  function include(next: boolean) {
    if (!next) keep(emptyTimer);
    onIncludedChange(next);
  }

  return <fieldset className={'weight-picker walking-picker ' + (optional ? '' : 'weight-picker-only')} disabled={disabled}>
    <legend className={optional ? '' : 'sr-only'}>散歩または軽い運動 {optional && <span className="subtle">任意</span>}</legend>
    {optional && <label className="weight-include"><Checkbox aria-label="この日の散歩または軽い運動を記録する" checked={included} onCheckedChange={checked => include(checked === true)} />この日の散歩・軽い運動を記録する</label>}
    <div className="walking-timer">
      <output className="walking-timer-clock" role="timer" aria-label="計測時間">
        {String(Math.floor(shownSeconds / 60)).padStart(2, '0')}分{String(shownSeconds % 60).padStart(2, '0')}秒
      </output>
      <Button type="button" className="walking-timer-button" aria-label={running ? '計測を一時停止' : timerUsed ? '計測を再開' : '計測を開始'} aria-pressed={running} onClick={toggle} disabled={disabled || elapsedSeconds >= 86400}>
        {running ? <Pause size={31} fill="currentColor" /> : <Play size={31} fill="currentColor" />}
      </Button>
      <span className="walking-timer-action">{running ? '一時停止' : timerUsed ? '再開' : 'スタート'}</span>
      {timerUsed && <Button type="button" variant="ghost" className="walking-timer-reset" onClick={() => keep(emptyTimer)}><RotateCcw size={15} />最初から計測</Button>}
      <p className="walking-timer-hint">計測した時間は、保存するとこの日の合計に足されます。1分未満も1分として記録します。</p>
    </div>
    <details className="walking-adjust">
      <summary>記録する分数を調整する</summary>
      {timerUsed && <p className="weight-not-included">計測した時間を保存します。分数を調整するときは、先に「最初から計測」を押してください。</p>}
      <div className="weight-wheels walking-wheels">
        <div className="weight-wheel-selection" aria-hidden="true" />
        <WeightWheel label="散歩または軽い運動の時間（分）" values={minutes} value={valid ? parsed : 0} disabled={disabled || timerUsed} onChange={change} />
        <span className="weight-wheel-unit" aria-hidden="true">分</span>
      </div>
      <output className="sr-only" aria-live="polite" aria-label="保存する時間">{valid ? parsed : 0}分</output>
    </details>
    {!valid && included && <p className="form-error" role="alert">時間は0〜1440分の整数で指定してください。</p>}
    {optional && !included && <p className="weight-not-included">この日の散歩・軽い運動の時間は保存しません。</p>}
  </fieldset>;
});
