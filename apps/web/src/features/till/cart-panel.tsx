'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Field } from '@/components/shared/field';
import { MoneyInput } from '@/components/shared/money-input';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { useSettings } from '@/features/settings/settings-provider';
import { CartLineRow } from '@/features/till/cart-line-row';
import { QuickCash } from '@/features/till/quick-cash';
import { useAppDispatch, useAppSelector } from '@/hooks/use-app-redux';
import { estimateTotals, vatLabel } from '@/lib/estimate';
import { ORDER_TYPE_LABELS, PAYMENT_LABELS } from '@/lib/labels';
import { parsePrice, priceText } from '@/lib/price-input';
import { revealWithin } from '@/lib/reveal';
import { cartCleared, completeSale, detailsSet, isLocked, quantitySet } from '@/stores/slices/cart-slice';

function Sum({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between text-lg font-bold' : 'flex justify-between text-sm'}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

// The items and the payment scroll; the total and the sale button stay in view below them
export function CartPanel() {
  const { draft, checkout } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const { money, vatBps } = useSettings();
  const [asking, setAsking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const cashInput = useRef<HTMLInputElement>(null);

  const locked = isLocked(checkout);
  const problem = checkout.status === 'editing' ? checkout.problem : null;
  const rate = draft.vatBps ?? vatBps;
  const totals = estimateTotals(draft.lines, rate);
  const cash = draft.method === 'CASH';
  const received = cash ? parsePrice(draft.cashText, Number.MAX_SAFE_INTEGER) : null;
  const change = received !== null && received >= totals.totalCents ? money(received - totals.totalCents) : '—';
  const priceChanged = problem !== null && problem.previousTotalCents !== null;
  const units = draft.lines.reduce((sum, line) => sum + line.quantity, 0);
  const empty = draft.lines.length === 0;

  // A line just added is shown, also at the end of a long cart
  const lineCount = useRef(draft.lines.length);
  useEffect(() => {
    const box = scroller.current;
    if (box && draft.lines.length > lineCount.current) {
      const added = box.querySelectorAll('[data-line]')[draft.lines.length - 1];
      if (added) {
        revealWithin(box, added);
      }
    }
    lineCount.current = draft.lines.length;
  }, [draft.lines.length]);

  // After a refusal, what has to be put right is shown: the cash field, or the first item with a problem
  useEffect(() => {
    if (problem?.cash) {
      cashInput.current?.focus();
      return;
    }
    const box = scroller.current;
    const wrong = box?.querySelector('[data-problem]');
    if (box && wrong) {
      revealWithin(box, wrong);
    }
  }, [problem]);

  let action = `${priceChanged ? 'Confirm new total' : 'Complete sale'} ${money(totals.totalCents)}`;
  if (checkout.status === 'sending') {
    action = 'Saving…';
  } else if (checkout.status === 'unconfirmed') {
    action = 'Retry (safe)';
  }

  return (
    <div className="flex min-h-0 flex-auto flex-col">
      <div className="flex min-h-13 items-center justify-between gap-3 border-b px-4 py-2">
        <h2 className="text-base font-semibold">
          Cart
          {units > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {units} {units === 1 ? 'item' : 'items'}
            </span>
          )}
        </h2>
        {!empty && (
          <Button variant="ghost" size="sm" disabled={locked} onClick={() => setAsking(true)}>
            Clear
          </Button>
        )}
      </div>

      <div ref={scroller} className="min-h-32 flex-auto space-y-3 overflow-y-auto overscroll-contain px-4 pb-4">
        {empty ? (
          <p className="flex items-center justify-center gap-2 py-5 text-sm text-muted-foreground">
            <ShoppingCart aria-hidden="true" className="size-4" />
            The cart is empty. Tap an item to add it.
          </p>
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
            <Field label="Cash received" error={problem?.cash}>
              <MoneyInput
                ref={cashInput}
                value={draft.cashText}
                disabled={locked}
                placeholder="e.g. 700"
                onChange={(event) => dispatch(detailsSet({ cashText: event.target.value }))}
              />
            </Field>
            {!empty && (
              <QuickCash
                totalCents={totals.totalCents}
                receivedCents={received}
                disabled={locked}
                onPick={(cents) => dispatch(detailsSet({ cashText: priceText(cents) }))}
              />
            )}
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
        <p className="text-xs text-muted-foreground">
          The server decides the final prices, VAT and total. The receipt shows its numbers.
        </p>
      </div>

      {/* sticky: still in view when the top of the page pushes the end of the cart below the screen */}
      <div className="sticky bottom-0 flex flex-col gap-3 rounded-b-xl border-t bg-card px-4 py-3">
        {checkout.status === 'unconfirmed' && (
          <Banner variant="warn">
            <strong>Waiting to confirm this sale.</strong> {checkout.message} The cart and payment are locked so the
            same sale cannot be taken twice. Press Retry: it is safe. You can also look in{' '}
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

        <dl className="flex flex-col gap-0.5">
          <Sum label="Subtotal" value={money(totals.subtotalCents)} />
          <Sum label={`VAT ${vatLabel(rate)}`} value={money(totals.vatCents)} />
          <Sum label="Total" value={money(totals.totalCents)} strong />
          {cash && <Sum label="Change" value={change} />}
        </dl>
        <Button
          className="h-12 w-full text-base"
          loading={checkout.status === 'sending'}
          disabled={empty}
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
