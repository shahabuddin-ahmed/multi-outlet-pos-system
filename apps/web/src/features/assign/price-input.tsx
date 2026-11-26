'use client';

import { useState } from 'react';
import { MoneyInput } from '@/components/shared/money-input';
import { parsePrice, PRICE_HINT, priceText } from '@/lib/price-input';

interface PriceInputProps {
  label: string;
  // null: no outlet price
  saved: number | null;
  placeholder: string;
  // Answers false when the price could not be saved
  onSave: (cents: number | null) => Promise<boolean>;
}

const textOf = (cents: number | null) => (cents === null ? '' : priceText(cents));

// Saves when the person leaves the field or presses Enter; empty means "follow the master price".
// Give it a key of the saved price, so it shows the new one after a change.
export function PriceInput({ label, saved, placeholder, onSave }: PriceInputProps) {
  const [draft, setDraft] = useState(textOf(saved));
  const [error, setError] = useState('');

  const commit = async () => {
    const empty = draft.trim() === '';
    const cents = empty ? null : parsePrice(draft);
    if (!empty && cents === null) {
      setError(PRICE_HINT);
      return;
    }
    setError('');
    if (cents === saved || !(await onSave(cents))) {
      setDraft(textOf(saved));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <MoneyInput
        aria-label={label}
        aria-invalid={Boolean(error)}
        wrapperClassName="w-36"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
      />
      <span role="alert" className="text-xs text-red-700 empty:hidden">
        {error}
      </span>
    </div>
  );
}
