'use client';

import { useMemo, useState } from 'react';
import { useDebounced } from '@/hooks/use-debounced';
import type { PeriodQuery } from '@/types';

export const PERIOD_LABELS = {
  all: 'All time',
  today: 'Today',
  month: 'This month',
  custom: 'Custom dates'
};

export type PeriodChoice = keyof typeof PERIOD_LABELS;

// The days a report covers. Which days "today" and "this month" are is decided by the API.
export function usePeriod() {
  const [choice, setChoice] = useState<PeriodChoice>('all');
  const [days, setDays] = useState({ from: '', to: '' });
  // Each waits until typing stops, so half a date is not asked for
  const from = useDebounced(days.from);
  const to = useDebounced(days.to);

  const query = useMemo<PeriodQuery>(() => {
    if (choice === 'custom') {
      return { from, to };
    }
    return choice === 'all' ? {} : { range: choice };
  }, [choice, from, to]);

  return { choice, setChoice, days, setDays, query };
}
