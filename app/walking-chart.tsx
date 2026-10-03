'use client';

import { Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { daysAgo, type Entry } from '@/lib/mochi';
import { walkingRecords } from '@/lib/walking';

export function WalkingChart({ entries, day, onRecord }: { entries: Entry[]; day: string; onRecord: () => void }) {
  const records = walkingRecords(entries, day);
  const week = walkingRecords(entries, day, 7);
  const total = week.length ? week.reduce((sum, entry) => sum + entry.walkingMinutes, 0) : null;
  const maximum = Math.max(10, Math.ceil(Math.max(0, ...records.map(entry => entry.walkingMinutes)) / 10) * 10);
  const y = (minutes: number) => 130 - minutes / maximum * 100;
  const x = (date: string) => 45 + (Date.parse(date) - Date.parse(daysAgo(day, 29))) / 86400000 / 29 * 430;

  return <section className="card chart-card walking-chart-card">
    <div className="section-heading"><h2>ウォーキング時間のうつりかわり</h2><span className="subtle">直近30日</span></div>
    <div className="average"><span>直近7日の合計</span><strong>{total ?? '—'}<small>分</small></strong></div>
    {records.length ? <>
      <svg className="weight-chart" viewBox="0 0 500 175" role="img" aria-label="直近30日のウォーキング時間の推移。日付ごとの分数は記録の項目から確認できます。">
        {[0, maximum / 2, maximum].map(minutes => <g key={minutes}><line x1="45" y1={y(minutes)} x2="475" y2={y(minutes)} stroke="#eee7e0" strokeDasharray="4 4" /><text x="0" y={y(minutes) + 4} fill="#82766f" fontSize="12">{minutes}分</text></g>)}
        <polyline points={records.map(entry => `${x(entry.day)},${y(entry.walkingMinutes)}`).join(' ')} fill="none" stroke="#839961" strokeWidth="3" strokeLinejoin="round" />
        {records.map(entry => <circle key={entry.day} cx={x(entry.day)} cy={y(entry.walkingMinutes)} r="4" fill="#839961"><title>{entry.day}: {entry.walkingMinutes}分</title></circle>)}
        <text x="45" y="163" fontSize="13" fill="#82766f">{daysAgo(day, 29).slice(5).replace('-', '/')}</text><text x="443" y="163" fontSize="13" fill="#82766f">今日</text>
      </svg>
      <p className="subtle">記録した日の分数を線でつないでいます。</p>
    </> : <div className="empty-chart"><Footprints size={34} /><p>はじめの記録を待っています</p><span>歩いた時間を、気軽に残してね。</span><Button variant="outline" onClick={onRecord}>ウォーキングを記録する</Button></div>}
  </section>;
}
