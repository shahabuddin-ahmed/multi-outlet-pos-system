'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api';
import type { Paged } from '@/types';

interface Switchable {
  id: string;
  name: string;
}

// The page with one row replaced by the API's newer copy of it
export const withRow = <T extends Switchable>(page: Paged<T>, row: T): Paged<T> => ({
  ...page,
  data: page.data.map((current) => (current.id === row.id ? row : current))
});

// The on/off switch of a list: on at once, off only after a question
export function useActiveSwitch<T extends Switchable>(
  save: (id: string, isActive: boolean) => Promise<T>,
  onSaved: (row: T) => void
) {
  const [asking, setAsking] = useState<T | null>(null);
  const [savingId, setSavingId] = useState('');

  const apply = async (row: T, isActive: boolean) => {
    setSavingId(row.id);
    try {
      onSaved(await save(row.id, isActive));
      toast.success(`${row.name} is switched ${isActive ? 'on' : 'off'}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingId('');
      setAsking(null);
    }
  };

  return {
    // The row waiting for the answer to "Switch off?"
    asking,
    savingId,
    toggle: (row: T, isActive: boolean) => (isActive ? void apply(row, true) : setAsking(row)),
    keep: () => setAsking(null),
    switchOff: () => asking && void apply(asking, false)
  };
}
