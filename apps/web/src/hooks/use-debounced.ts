'use client';

import { useEffect, useState } from 'react';

const DELAY_MS = 300;

// The value once it has stopped changing, so a search runs after typing and not on every key
export function useDebounced<T>(value: T): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), DELAY_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return settled;
}
