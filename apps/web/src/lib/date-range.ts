import { dateOf, dayOf, type Day } from '@/lib/day';
import type { PeriodQuery } from '@/types';

export const PRESET_LABELS = {
  all: 'All time',
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  month: 'This month',
  lastMonth: 'Last month'
};

export type Preset = keyof typeof PRESET_LABELS;

// Both days are included. All time has neither.
export interface DateRange {
  preset: Preset | 'custom';
  from?: Day;
  to?: Day;
}

export const ALL_TIME: DateRange = { preset: 'all' };

export function presetRange(preset: Preset, today: Day): DateRange {
  const now = dateOf(today);
  const [year, month, date] = [now.getFullYear(), now.getMonth(), now.getDate()];
  const between = (from: Date, to: Date): DateRange => ({ preset, from: dayOf(from), to: dayOf(to) });
  const daysAgo = (count: number) => new Date(year, month, date - count);

  switch (preset) {
    case 'all':
      return ALL_TIME;
    case 'today':
      return between(now, now);
    case 'yesterday':
      return between(daysAgo(1), daysAgo(1));
    case 'last7':
      return between(daysAgo(6), now);
    case 'last30':
      return between(daysAgo(29), now);
    case 'month':
      return between(new Date(year, month, 1), now);
    case 'lastMonth':
      // Day 0 of a month is the last day of the one before it
      return between(new Date(year, month - 1, 1), new Date(year, month, 0));
  }
}

// Reports can be asked for "today" and "this month" by name: the API then decides which days those are
export const periodQueryOf = ({ preset, from, to }: DateRange): PeriodQuery =>
  preset === 'today' || preset === 'month' ? { range: preset } : { from, to };
