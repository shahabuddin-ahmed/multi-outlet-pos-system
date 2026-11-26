import { useSettings } from '@/features/settings/settings-provider';
import type { OutletRevenue } from '@/types';

// One series, so one colour and no legend. Bar lengths compare the outlets with the best one;
// the amount beside each bar is the figure. The rows share their columns, so every bar is measured
// against the same width.
export function OutletBars({ outlets }: { outlets: OutletRevenue[] }) {
  const { money, count } = useSettings();
  const highest = Math.max(...outlets.map((row) => row.netSalesCents));

  return (
    <ul className="grid grid-cols-[auto_1fr_auto] gap-x-3">
      {outlets.map(({ outlet, netSalesCents, salesCount }) => (
        <li
          key={outlet.id}
          tabIndex={0}
          className="group relative col-span-3 grid grid-cols-subgrid items-center rounded-md text-sm hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="font-semibold">{outlet.code}</span>
          <span aria-hidden="true" className="flex items-center self-stretch border-l border-input py-3">
            {netSalesCents > 0 && (
              <span
                className="block h-3 min-w-0.5 rounded-r bg-primary"
                style={{ width: `${(netSalesCents / highest) * 100}%` }}
              />
            )}
          </span>
          <span className="text-right whitespace-nowrap tabular-nums">{money(netSalesCents)}</span>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-14 z-10 hidden rounded-lg border bg-card px-3 py-2 text-xs shadow-md group-hover:block group-focus-visible:block"
          >
            <span className="block font-semibold">{outlet.name}</span>
            <span className="text-muted-foreground">
              {count(salesCount)} {salesCount === 1 ? 'sale' : 'sales'}
              {!outlet.isActive && ' · outlet is off'}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
