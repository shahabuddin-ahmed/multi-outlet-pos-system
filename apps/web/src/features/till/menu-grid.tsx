import { Badge } from '@/components/ui/badge';
import type { OutletMenuItem } from '@/types';

interface MenuGridProps {
  items: OutletMenuItem[];
  money: (cents: number) => string;
  disabled: boolean;
  onAdd: (item: OutletMenuItem) => void;
}

// One large button per item, made for touch screens
export function MenuGrid({ items, money, disabled, onAdd }: MenuGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3">
      {items.map((item) => (
        <li key={item.menuItemId} className="flex">
          <button
            type="button"
            disabled={disabled || item.outOfStock}
            onClick={() => onAdd(item)}
            className="flex w-full flex-col items-start gap-1 rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="text-sm font-semibold">{item.name}</span>
            <span className="text-base font-bold text-primary tabular-nums">{money(item.effectivePriceCents)}</span>
            <span className="text-xs text-muted-foreground">
              {item.sku}
              {item.priceSource === 'OUTLET' && ' · outlet price'}
            </span>
            {item.outOfStock ? (
              <Badge variant="error">Out of stock</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">{item.stock} in stock</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
