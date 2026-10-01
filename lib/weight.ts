import type { Entry } from './mochi';

export type WeightEntry = Entry & { weight: number };

function isWeightEntry(entry: Entry): entry is WeightEntry {
  return entry.weight !== null && Number.isFinite(entry.weight);
}

/** Use the latest measured day, regardless of API/storage ordering or gaps. */
export function latestWeight(entries: Entry[], day: string): WeightEntry | undefined {
  return entries.filter(e => e.day <= day && isWeightEntry(e))
    .sort((a, b) => b.day.localeCompare(a.day))[0] as WeightEntry | undefined;
}

/** Historical edits must never compare against a later measurement. */
export function previousWeight(entries: Entry[], day: string): WeightEntry | undefined {
  return entries.filter(e => e.day < day && isWeightEntry(e))
    .sort((a, b) => b.day.localeCompare(a.day))[0] as WeightEntry | undefined;
}

export function weightDraft(entries: Entry[], entry: Entry, recordWeight = false) {
  const previous = previousWeight(entries, entry.day);
  return {
    value: String(entry.weight ?? previous?.weight ?? 60),
    // A carried-forward suggestion is not a new measurement until chosen.
    included: recordWeight || entry.weight !== null,
  };
}

export function adjustWeight(value: number, tenths: number) {
  return Math.min(500, Math.max(1, (Math.round(value * 10) + tenths) / 10));
}

export function weightChange(current: number, previous: number) {
  const tenths = Math.round((current - previous) * 10);
  if (tenths === 0) return '前回と同じ';
  return `前回から ${tenths > 0 ? '+' : '−'}${(Math.abs(tenths) / 10).toFixed(1)} kg`;
}

export function weightDate(day: string) {
  return day.slice(5).replace('-', '/');
}
