import { ChartColumn } from 'lucide-react';
import { useSettings } from '@/features/settings/settings-provider';
import type { TopItem } from '@/types';

// Best sellers in the order the API ranks them, by quantity
export function TopItemsList({ items }: { items: TopItem[] }) {
  const { count } = useSettings();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
        <ChartColumn aria-hidden="true" className="size-5" />
        No sales in this period
      </div>
    );
  }

  return (
    <ol className="text-sm">
      {items.map((item, index) => (
        <li key={item.menuItemId} className="flex items-baseline gap-3 border-b py-2.5 last:border-b-0">
          <span className="w-4 text-muted-foreground tabular-nums">{index + 1}</span>
          <span className="min-w-0 flex-1 font-medium">{item.name}</span>
          <span className="whitespace-nowrap tabular-nums">{count(item.quantity)} sold</span>
        </li>
      ))}
    </ol>
  );
}
