'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { TableSkeleton } from '@/components/shared/skeletons';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OutletSelect } from '@/features/outlets/outlet-select';
import { useOutletChoice } from '@/features/outlets/use-outlet-choice';
import type { Outlet } from '@/types';

interface OneOutletProps {
  title: string;
  // Shown while there is no outlet to show
  text: string;
  children: (outlet: Outlet, picker: ReactNode) => ReactNode;
}

// For head office pages about one outlet: loads the outlets, lets one be picked and hands it on
export function OneOutlet({ title, text, children }: OneOutletProps) {
  const { outlets, selected, choose } = useOutletChoice();

  if (selected && outlets.data) {
    return children(selected, <OutletSelect outlets={outlets.data} value={selected.id} onChange={choose} />);
  }

  return (
    <>
      <PageHeader title={title} text={text} />
      {outlets.data ? (
        <Card>
          <EmptyState icon={Store} title="No outlets yet" text="Create an outlet on the Outlets page first.">
            <Link href="/outlets" className={buttonVariants({ size: 'sm' })}>
              Go to outlets
            </Link>
          </EmptyState>
        </Card>
      ) : (
        <PageState
          message={outlets.error || 'Loading…'}
          error={Boolean(outlets.error)}
          onRetry={outlets.reload}
          skeleton={<TableSkeleton columns={5} />}
        />
      )}
    </>
  );
}
