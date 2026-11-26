'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QUANTITY_MAX, type CartLine } from '@/stores/slices/cart-slice';

interface CartLineRowProps {
  line: CartLine;
  problem?: string;
  money: (cents: number) => string;
  disabled: boolean;
  // 0 removes the line
  onQuantity: (quantity: number) => void;
}

// Up to four digits, or nothing while a new number is being typed
const DIGITS = /^\d{0,4}$/;

export function CartLineRow({ line, problem, money, disabled, onQuantity }: CartLineRowProps) {
  // What is in the box while it is being edited; otherwise the box shows the cart's quantity
  const [typed, setTyped] = useState<string | null>(null);

  // A number in range changes the cart at once, so the total is always what the cart says. An empty box or
  // a 0 changes nothing, and leaving the box then brings the old quantity back.
  const type = (text: string) => {
    const quantity = Number(text);
    if (!DIGITS.test(text) || quantity > QUANTITY_MAX) {
      return;
    }
    setTyped(text);
    if (quantity >= 1) {
      onQuantity(quantity);
    }
  };

  return (
    <li data-line data-problem={problem ? true : undefined} className="flex flex-col gap-1.5 border-b py-2.5">
      <div className="flex justify-between gap-3 text-sm font-semibold">
        <span>{line.name}</span>
        <span className="tabular-nums">{money(line.unitPriceCents * line.quantity)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          aria-label={`One less ${line.name}`}
          onClick={() => onQuantity(line.quantity - 1)}
        >
          <Minus aria-hidden="true" className="size-4" />
        </Button>
        <Input
          aria-label={`Quantity of ${line.name}`}
          inputMode="numeric"
          className="w-16 text-center font-semibold tabular-nums"
          disabled={disabled}
          value={typed ?? line.quantity}
          onChange={(event) => type(event.target.value)}
          onFocus={(event) => event.target.select()}
          onBlur={() => setTyped(null)}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === 'Escape') && event.currentTarget.blur()}
        />
        <Button
          variant="outline"
          size="icon"
          disabled={disabled || line.quantity >= QUANTITY_MAX}
          aria-label={`One more ${line.name}`}
          onClick={() => onQuantity(line.quantity + 1)}
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{money(line.unitPriceCents)} each</span>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-red-50 hover:text-red-700"
          disabled={disabled}
          aria-label={`Remove ${line.name}`}
          onClick={() => onQuantity(0)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {problem && (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {problem}
        </p>
      )}
    </li>
  );
}
