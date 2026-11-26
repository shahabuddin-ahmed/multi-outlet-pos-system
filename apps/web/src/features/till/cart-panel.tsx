'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/shared/field';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { useSettings } from '@/features/settings/settings-provider';
import { CartLineRow } from '@/features/till/cart-line-row';
import { useAppDispatch, useAppSelector } from '@/hooks/use-app-redux';
import { estimateTotals, vatLabel } from '@/lib/estimate';
import { ORDER_TYPE_LABELS, PAYMENT_LABELS } from '@/lib/labels';
import { parsePrice } from '@/lib/price-input';
import { cartCleared, completeSale, detailsSet, isLocked, quantitySet } from '@/stores/slices/cart-slice';

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between text-base font-bold' : 'flex justify-between text-sm'}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function CartPanel() {
  const { draft, checkout } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const { money, vatBps } = useSettings();
  const [asking, setAsking] = useState(false);

  const locked = isLocked(checkout);
  const problem = checkout.status === 'editing' ? checkout.problem : null;
  const rate = draft.vatBps ?? vatBps;
  const totals = estimateTotals(draft.lines, rate);
  const cash = draft.method === 'CASH';
  const received = cash ? parsePrice(draft.cashText, Number.MAX_SAFE_INTEGER) : null;
  const change = received !== null && received >= totals.totalCents ? money(received - totals.totalCents) : '—';
  const priceChanged = problem !== null && problem.previousTotalCents !== null;

  let action = `${priceChanged ? 'Confirm new total' : 'Complete sale'} ${money(totals.totalCents)}`;
  if (checkout.status === 'sending') {
    action = 'Saving…';
  } else if (checkout.status === 'unconfirmed') {
    action = 'Retry (safe)';
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Cart</h2>

      {checkout.status === 'unconfirmed' && (
        <Banner variant="warn">
          <strong>Waiting to confirm this sale.</strong> {checkout.message} The cart and payment are locked so the same
          sale cannot be taken twice. Press Retry: it is safe. You can also look in{' '}
          <Link href="/sales" className="underline">
            Sales history
          </Link>
          .
        </Banner>
      )}
      {priceChanged && (
        <Banner variant="warn">
          <strong>Prices changed while you were selling.</strong> The cart now shows the new prices. New total{' '}
          {money(totals.totalCents)} (was {money(problem.previousTotalCents!)}). Check it with the customer, then
          confirm.
        </Banner>
      )}
      {problem?.message && <Banner variant="error">{problem.message}</Banner>}

      {draft.lines.length === 0 ? (
        <p className="py-2.5 text-sm text-muted-foreground">No items yet. Tap an item to add it.</p>
      ) : (
        <ul>
          {draft.lines.map((line) => (
            <CartLineRow
              key={line.menuItemId}
              line={line}
              problem={problem?.lines[line.menuItemId]}
              money={money}
              disabled={locked}
              onQuantity={(quantity) => dispatch(quantitySet({ menuItemId: line.menuItemId, quantity }))}
            />
          ))}
        </ul>
      )}

      <Segmented
        label="Order type"
        options={ORDER_TYPE_LABELS}
        value={draft.orderType}
        disabled={locked}
        onChange={(orderType) => dispatch(detailsSet({ orderType }))}
      />
      {draft.orderType === 'DINE_IN' && (
        <Field label="Table (optional)">
          <Input
            value={draft.tableLabel}
            disabled={locked}
            maxLength={20}
            placeholder="T4"
            onChange={(event) => dispatch(detailsSet({ tableLabel: event.target.value }))}
          />
        </Field>
      )}

      <Segmented
        label="Payment received (recorded here, not processed)"
        options={PAYMENT_LABELS}
        value={draft.method}
        disabled={locked}
        onChange={(method) => dispatch(detailsSet({ method }))}
      />
      {cash ? (
        <>
          <Field label="Cash received">
            <Input
              inputMode="decimal"
              value={draft.cashText}
              disabled={locked}
              placeholder="e.g. 700"
              aria-invalid={Boolean(problem?.cash)}
              className="aria-invalid:border-red-600"
              onChange={(event) => dispatch(detailsSet({ cashText: event.target.value }))}
            />
          </Field>
          <p role="alert" className="text-sm text-red-700 empty:hidden">
            {problem?.cash}
          </p>
        </>
      ) : (
        <Field label="Reference (optional)" hint="Card approval or mobile banking transaction id">
          <Input
            value={draft.reference}
            disabled={locked}
            maxLength={40}
            onChange={(event) => dispatch(detailsSet({ reference: event.target.value }))}
          />
        </Field>
      )}

      <dl className="flex flex-col gap-1">
        <Sum label="Subtotal" value={money(totals.subtotalCents)} />
        <Sum label={`VAT ${vatLabel(rate)}`} value={money(totals.vatCents)} />
        <Sum label="Total" value={money(totals.totalCents)} strong />
        {cash && <Sum label="Change" value={change} />}
      </dl>
      <p className="text-xs text-muted-foreground">
        The server decides the final prices, VAT and total. The receipt shows its numbers.
      </p>

      <div className="flex gap-2.5">
        <Button variant="outline" disabled={locked || draft.lines.length === 0} onClick={() => setAsking(true)}>
          Clear
        </Button>
        <Button
          className="flex-1"
          disabled={checkout.status === 'sending' || draft.lines.length === 0}
          onClick={() => void dispatch(completeSale(vatBps))}
        >
          {action}
        </Button>
      </div>

      {asking && (
        <Dialog title="Clear the cart?" onClose={() => setAsking(false)}>
          <p className="text-sm text-muted-foreground">Every item is removed from the cart.</p>
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setAsking(false)}>
              Keep items
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                dispatch(cartCleared());
                setAsking(false);
              }}
            >
              Clear cart
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
