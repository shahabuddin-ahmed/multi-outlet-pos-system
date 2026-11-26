import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageState } from '@/components/shared/page-state';
import { AssignView } from '@/features/assign/assign-view';

export const metadata: Metadata = { title: 'Assign menu' };

export default function AssignPage() {
  // The view reads the address (?outlet=), which is only known in the browser
  return (
    <Suspense fallback={<PageState message="Loading…" />}>
      <AssignView />
    </Suspense>
  );
}
