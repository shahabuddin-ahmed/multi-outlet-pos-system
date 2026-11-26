import { Minus, Plus } from 'lucide-react';
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

export function CartLineRow({ line, problem, money, disabled, onQuantity }: CartLineRowProps) {
  // Whole numbers in range only; anything else leaves the quantity as it was
  const type = (text: string) => {
    const quantity = Number(text);
    if (/^\d+$/.test(text) && quantity >= 1 && quantity <= QUANTITY_MAX) {
      onQuantity(quantity);
    }
  };

  return (
    <li className="flex flex-col gap-1.5 border-b py-2.5">
      <div className="flex justify-between gap-3 text-sm font-semibold">
        <span>{line.name}</span>
        <span className="tabular-nums">{money(line.unitPriceCents * line.quantity)}</span>
      </div>
      <div className="flex items-center gap-2">
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
          className="w-16 text-center"
          disabled={disabled}
          value={line.quantity}
          onChange={(event) => type(event.target.value)}
          onFocus={(event) => event.target.select()}
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
        <span className="flex-1 text-xs text-muted-foreground">{money(line.unitPriceCents)} each</span>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={() => onQuantity(0)}>
          Remove
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
