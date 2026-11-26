import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageState } from '@/components/shared/page-state';
import { SalesView } from '@/features/sales/sales-view';

export const metadata: Metadata = { title: 'Sales history' };

export default function SalesPage() {
  // The view reads the address (?outlet=), which is only known in the browser
  return (
    <Suspense fallback={<PageState message="Loading…" />}>
      <SalesView />
    </Suspense>
  );
}
