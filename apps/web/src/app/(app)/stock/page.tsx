import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageState } from '@/components/shared/page-state';
import { StockView } from '@/features/stock/stock-view';

export const metadata: Metadata = { title: 'Stock' };

export default function StockPage() {
  // The view reads the address (?outlet=), which is only known in the browser
  return (
    <Suspense fallback={<PageState message="Loading…" />}>
      <StockView />
    </Suspense>
  );
}
