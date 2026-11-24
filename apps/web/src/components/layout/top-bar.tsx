'use client';

import { Store } from 'lucide-react';
import { useAppSelector } from '@/hooks/use-app-redux';

export function TopBar() {
  const outlet = useAppSelector((state) => state.outlet.current);

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-2.5 lg:px-9">
      <span className="inline-flex h-10 max-w-full items-center gap-2 rounded-[10px] border bg-secondary px-3 text-sm font-medium">
        <Store aria-hidden="true" className="size-4" />
        {outlet ? (
          <span className="truncate">{outlet.name}</span>
        ) : (
          <span className="text-muted-foreground">No outlet selected</span>
        )}
      </span>
    </header>
  );
}
