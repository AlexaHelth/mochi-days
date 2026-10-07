'use client';
import type { ReactNode } from 'react';
import { ChevronRight, Footprints, Heart, Meh, Moon, NotebookPen, Scale, Smile, StretchHorizontal, Target, Utensils, Sun, Leaf, House, MessageCircle, Sparkles, Flower2, type LucideIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { habitTheme, type HabitTheme } from '@/lib/habits';
import { hasRecord } from '@/lib/history';
import { previousWeight, weightChange, weightDate } from '@/lib/weight';
import type { CareDay, Entry, Settings } from '@/lib/mochi';

const moods = ['元気！', 'ふつう', 'おつかれ'];
const moodIcons = [Smile, Meh, Moon];
const habitIcons:Record<HabitTheme,LucideIcon> = {move:Footprints,stretch:StretchHorizontal,rest:Moon,food:Utensils,mind:Heart,senses:Leaf,home:House,routine:Sun,sleep:Moon,connect:MessageCircle,enjoy:Sparkles,kind:Flower2};

function RecordRow({ icon: Icon, label, value, hint, recorded, disabled, onClick }: {
  icon: LucideIcon; label: string; value: string; hint?: string; recorded: boolean;
  disabled: boolean; onClick: () => void;
}) {
  return <button type="button" className={'today-record-row ' + (recorded ? 'recorded' : '')} disabled={disabled} onClick={onClick} aria-label={`${label}を${recorded ? '編集' : '記録'}する`}>
    <span className="today-record-icon"><Icon size={20}/></span>
    <span className="today-record-copy"><span className="today-record-main"><span>{label}</span><strong>{value}</strong></span>{hint && <small>{hint}</small>}</span>
    <ChevronRight size={17} className="today-row-arrow"/>
  </button>;
}

export function TodayView({ entry, entries, settings, habitNames, care, pet, disabled, saving, saved, recordsOpen, onGoal, onMood, onWeight, onWalking, onNote, onHabit, onToggleHabit, onRest, onResume }: {
  entry: Entry; entries: Entry[]; settings: Settings; habitNames: string[]; care: Required<CareDay>; pet: ReactNode;
  disabled: boolean; saving: boolean; saved: boolean; recordsOpen: boolean;
  onGoal: () => void; onMood: () => void; onWeight: () => void; onWalking: () => void;
  onNote: () => void; onHabit: (index: number) => void; onToggleHabit: (index: number, checked: boolean) => void;
  onRest: () => void; onResume: () => void;
}) {
  const previous = previousWeight(entries, entry.day);
  const weightHint = entry.weight !== null
    ? previous ? `${weightChange(entry.weight, previous.weight)} · ${weightDate(previous.day)}比` : 'はじめの体重の記録'
    : previous ? `前回の記録：${previous.weight.toFixed(1)} kg · ${weightDate(previous.day)}` : undefined;
  const recordedToday = hasRecord(entry);
  const MoodIcon = entry.mood === null ? Smile : moodIcons[entry.mood];
  return <div className="today-home">
    <button type="button" className="today-goal" onClick={onGoal} disabled={disabled} aria-label={settings.goal ? `目標を変更する：${settings.goal}` : '目標を選ぶ'}>
      <Target size={15}/><span>{settings.goal || 'これからの、ゆるい目標を選ぶ'}</span><ChevronRight size={15}/>
    </button>
    <section className="today-companion" aria-label={`${settings.name}と、ひと息`}>{pet}</section>
    {recordsOpen ? <>
      <section className="today-records" aria-labelledby="today-record-title">
        <div className={'today-section-heading'+(recordedToday?' has-record':'')}><h2 id="today-record-title">きょうの記録</h2><span>{saving ? '保存中…' : saved ? '保存しました' : recordedToday ? 'きょうも、ひとつ残せたね' : '気が向いたら、ひとつ'}</span></div>
        <RecordRow icon={MoodIcon} label="気分" value={entry.mood === null ? '今の気分をのこす' : moods[entry.mood]} recorded={entry.mood !== null} disabled={disabled} onClick={onMood}/>
        {settings.showWeight && <RecordRow icon={Scale} label="体重" value={entry.weight !== null ? `${entry.weight.toFixed(1)} kg` : '測れたら、のこそう'} hint={weightHint} recorded={entry.weight !== null} disabled={disabled} onClick={onWeight}/>}
        <RecordRow icon={Footprints} label="散歩・軽い運動" value={entry.walkingMinutes == null ? '動いたらのこそう' : `${entry.walkingMinutes} 分`} recorded={entry.walkingMinutes != null} disabled={disabled} onClick={onWalking}/>
        <RecordRow icon={NotebookPen} label="メモ" value={entry.note?.trim() ? 'ひとこと残せたね' : 'ひとこと残そう'} hint={entry.note?.trim() || undefined} recorded={!!entry.note?.trim()} disabled={disabled} onClick={onNote}/>
      </section>
      <section className="today-habits" aria-labelledby="today-habit-title">
        <div className="today-section-heading"><h2 id="today-habit-title">きょうの小さな習慣</h2><span>今日の3つ · できるものだけ</span></div>
        <div className="today-habit-list">{habitNames.map((habit, index) => {
          const id = 'h' + index, checked = entry.done.includes(id), partial = entry.partial?.includes(id), Icon = habitIcons[habitTheme(habit)];
          return <div key={id} className={'today-habit-row ' + (checked ? 'completed' : partial ? 'partly' : '')}>
            <button type="button" className="today-habit-detail" disabled={disabled} onClick={() => onHabit(index)} aria-label={`習慣「${habit}」を記録する`}><span className={'habit-icon habit-' + index}><Icon size={19}/></span><span>{habit}{partial && !checked && <small>少しできた</small>}</span></button>
            <label className="today-habit-check"><Checkbox checked={checked} disabled={disabled} onCheckedChange={value => onToggleHabit(index, value === true)} aria-label={`${habit}ができた`}/></label>
          </div>;
        })}</div>

      </section>
    </> : <section className="today-rest" aria-label="今日のおやすみ">
      <Moon size={22}/><h2>{care.finished ? '今日はここまでで、花まる。' : '今日は、一緒におやすみ。'}</h2>
      <p>記録はいつでも、気が向いたときに。</p><button type="button" onClick={onResume} disabled={disabled}>記録を開く<ChevronRight size={15}/></button>
    </section>}
    <button type="button" className="today-rest-link" onClick={onRest} disabled={disabled}><Moon size={15}/>{care.resting || care.finished ? 'おやすみを終える' : '今日は休む'}</button>
  </div>;
}
