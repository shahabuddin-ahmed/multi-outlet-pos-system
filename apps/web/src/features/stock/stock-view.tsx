'use client';

import { OneOutlet } from '@/features/outlets/one-outlet';
import { useUser } from '@/features/session/use-user';
import { OutletStock } from '@/features/stock/outlet-stock';

// A manager sees the own outlet; head office picks one
export function StockView() {
  const { outlet } = useUser();

  if (outlet) {
    return <OutletStock outletId={outlet.id} outletName={outlet.name} />;
  }

  return (
    <OneOutlet title="Stock" text="Stock of each item at an outlet">
      {(chosen, picker) => (
        <OutletStock key={chosen.id} outletId={chosen.id} outletName={chosen.name} picker={picker} />
      )}
    </OneOutlet>
  );
}
