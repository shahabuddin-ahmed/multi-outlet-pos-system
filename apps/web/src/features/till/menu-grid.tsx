import { CardGridSkeleton } from '@/components/shared/skeletons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OutletMenuItem } from '@/types';

interface MenuGridProps {
  items: OutletMenuItem[];
  // How many of each item are in the cart, by menu item id
  inCart: Map<string, number>;
  money: (cents: number) => string;
  disabled: boolean;
  onAdd: (item: OutletMenuItem) => void;
}

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3';

export function MenuGridSkeleton() {
  return <CardGridSkeleton count={8} className={GRID} cardClassName="h-32" />;
}

// One large button per item, made for touch screens
export function MenuGrid({ items, inCart, money, disabled, onAdd }: MenuGridProps) {
  return (
    <ul className={GRID}>
      {items.map((item) => {
        const quantity = inCart.get(item.menuItemId) ?? 0;
        return (
          <li key={item.menuItemId} className="flex">
            <button
              type="button"
              disabled={disabled || item.outOfStock}
              onClick={() => onAdd(item)}
              className={cn(
                'relative flex w-full flex-col items-start gap-1 rounded-xl border bg-card p-3.5 text-left transition-[border-color,box-shadow,transform] select-none hover:border-indigo-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:shadow-none motion-reduce:transition-none motion-reduce:active:scale-100',
                quantity > 0 && 'border-primary ring-1 ring-primary hover:border-primary'
              )}
            >
              {quantity > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums shadow">
                  {quantity}
                  <span className="sr-only"> in the cart.</span>
                </span>
              )}
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
        );
      })}
    </ul>
  );
}
