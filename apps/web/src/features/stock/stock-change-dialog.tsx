'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/shared/field';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { api, errorMessage } from '@/lib/api';
import { STOCK_REASON_LABELS } from '@/lib/labels';
import { isSettled } from '@/lib/retry';
import { newUuid } from '@/lib/uuid';
import type { ManualStockReason, StockChange, StockLine } from '@/types';

const REASONS: ManualStockReason[] = ['RESTOCK', 'WASTE', 'ADJUSTMENT'];
const EXAMPLES: Record<ManualStockReason, string> = { RESTOCK: 'e.g. 20', WASTE: 'e.g. -3', ADJUSTMENT: 'e.g. -1' };
const WHOLE_NUMBER = /^[+-]?\d{1,7}$/;

// null: not a change (not a whole number, or 0)
const deltaOf = (text: string): number | null => {
  const value = WHOLE_NUMBER.test(text.trim()) ? Number(text.trim()) : 0;
  return value === 0 ? null : value;
};

interface StockChangeDialogProps {
  outletId: string;
  line: StockLine;
  reason: ManualStockReason;
  // The dialog is over and the stock may have changed
  onDone: () => void;
}

export function StockChangeDialog({ outletId, line, reason: startReason, onDone }: StockChangeDialogProps) {
  const [text, setText] = useState('');
  const [reason, setReason] = useState(startReason);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { errors, check, clear } = useFieldErrors<'delta'>();
  // A change that got no answer. Only this one, with its key, may be sent again.
  const [unanswered, setUnanswered] = useState<{ key: string; change: StockChange } | null>(null);

  const delta = deltaOf(text);
  const result = delta === null ? null : line.stock + delta;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!unanswered && !check({ delta: delta === null ? 'Enter a whole number, not 0' : '' })) {
      return;
    }
    const attempt = unanswered ?? {
      key: newUuid(),
      change: { delta: delta!, reason, note: note.trim() || null }
    };
    setSaving(true);
    setError('');
    try {
      const movement = await api.changeStock(outletId, line.menuItemId, attempt.key, attempt.change);
      toast.success(`${line.name}: stock is now ${movement.quantityAfter}`);
      onDone();
    } catch (failure) {
      if (isSettled(failure, unanswered !== null)) {
        setUnanswered(null);
        setError(errorMessage(failure));
      } else {
        setUnanswered(attempt);
      }
      setSaving(false);
    }
  };

  return (
    <Dialog title="Change stock" onClose={onDone}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {line.name} · now <strong>{line.stock}</strong> in stock
        </p>
        {unanswered && (
          <Banner variant="warn">
            No answer from the server. The change may already be saved. Press Retry: it is applied only once.
          </Banner>
        )}
        <Field label="Change" hint="Use a plus number to add and a minus number to remove" error={errors.delta}>
          <Input
            inputMode="text"
            value={text}
            disabled={Boolean(unanswered)}
            placeholder={EXAMPLES[reason]}
            onChange={(event) => {
              setText(event.target.value);
              clear('delta');
            }}
            required
          />
        </Field>
        {result !== null && (
          <p className="text-sm text-muted-foreground">
            {result < 0 ? 'Stock cannot go below 0' : `Result: ${line.stock} → ${result}`}
          </p>
        )}
        <Field label="Reason">
          <Select
            options={REASONS.map((option) => ({ value: option, label: STOCK_REASON_LABELS[option] }))}
            value={reason}
            disabled={Boolean(unanswered)}
            onChange={setReason}
            className="w-full"
          />
        </Field>
        <Field label="Note (optional)">
          <Input
            value={note}
            disabled={Boolean(unanswered)}
            maxLength={200}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <p role="alert" className="text-sm text-red-700 empty:hidden">
          {error}
        </p>
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onDone}>
            {unanswered ? 'Close and check' : 'Cancel'}
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : unanswered ? 'Retry (safe)' : 'Save'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
