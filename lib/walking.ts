import { daysAgo, type Entry } from './mochi';

export type WalkingEntry = Entry & { walkingMinutes: number };
function isWalkingEntry(entry: Entry): entry is WalkingEntry {
  return typeof entry.walkingMinutes === 'number' && Number.isInteger(entry.walkingMinutes)
    && entry.walkingMinutes >= 0 && entry.walkingMinutes <= 1440;
}

/** A measured zero is a record; an omitted day is not zero minutes. */
export function walkingRecords(entries: Entry[], day: string, days = 30): WalkingEntry[] {
  const first = daysAgo(day, days - 1);
  return entries.filter((entry): entry is WalkingEntry => entry.day >= first && entry.day <= day && isWalkingEntry(entry))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function previousWalking(entries: Entry[], day: string): WalkingEntry | undefined {
  return entries.filter((entry): entry is WalkingEntry => entry.day < day && isWalkingEntry(entry))
    .sort((a, b) => b.day.localeCompare(a.day))[0];
}

export function walkingDraft(entries: Entry[], entry: Entry, recordWalking = false) {
  return {
    value: String(entry.walkingMinutes ?? previousWalking(entries, entry.day)?.walkingMinutes ?? 0),
    // A previous day's suggestion becomes a new record only when explicitly saved.
    included: recordWalking || entry.walkingMinutes != null,
  };
}
