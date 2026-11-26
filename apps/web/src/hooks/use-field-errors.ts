'use client';

import { useState } from 'react';

// Checks a form before it is sent: each message is shown under its own field
export function useFieldErrors<K extends string>() {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

  // An empty message means the field is fine. True when all are; otherwise the first wrong field gets the focus.
  const check = (found: Record<K, string>): boolean => {
    setErrors(found);
    const valid = Object.values(found).every((message) => !message);
    if (!valid) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    }
    return valid;
  };
  // A message goes as soon as its field is changed
  const clear = (field: K) => setErrors((current) => (current[field] ? { ...current, [field]: '' } : current));

  return { errors, check, clear };
}
