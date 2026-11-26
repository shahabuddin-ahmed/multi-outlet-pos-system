'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { ListCard } from '@/components/shared/list-card';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { Refreshing } from '@/components/shared/refreshing';
import { CardGridSkeleton } from '@/components/shared/skeletons';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueTable } from '@/features/reports/revenue-table';
import { TopItemsList } from '@/features/reports/top-items-list';
import { useApiData } from '@/hooks/use-api-data';
import { LIST_PAGE_SIZE } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import { ALL_TIME, periodQueryOf } from '@/lib/date-range';

const TOP_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4';

export function ReportsView() {
  const [range, setRange] = useState(ALL_TIME);
  const [offset, setOffset] = useState(0);

  // Both show the same page of outlets, in the same order
  const query = useMemo(() => ({ ...periodQueryOf(range), offset, limit: LIST_PAGE_SIZE }), [range, offset]);
  const revenue = useApiData(useMemo(() => () => api.revenueByOutlet(query), [query]));
  const top = useApiData(useMemo(() => () => api.topItems(query), [query]));

  return (
    <>
      <PageHeader title="Reports" text="Revenue by outlet and the best sellers of each">
        <DateRangePicker label="Period" value={range} onChange={setRange} />
      </PageHeader>

      <ListCard
        page={revenue.data}
        error={revenue.error}
        loading={revenue.loading}
        columns={5}
        onRetry={revenue.reload}
        onPage={setOffset}
        empty={{
          icon: Store,
          title: 'No outlets yet',
          text: 'Create an outlet on the Outlets page first.',
          children: (
            <Link href="/outlets" className={buttonVariants({ size: 'sm' })}>
              Go to outlets
            </Link>
          )
        }}
      >
        {revenue.data && <RevenueTable report={revenue.data} />}
      </ListCard>

      {/* Left out while the table shows an error, so one problem is told once */}
      {revenue.error ? null : top.data ? (
        <Refreshing active={top.loading} className={TOP_GRID}>
          {top.data.data.map(({ outlet, items }) => (
            <Card key={outlet.id}>
              <CardHeader className="pb-1">
                <CardTitle>{outlet.name} · top 5</CardTitle>
              </CardHeader>
              <CardContent>
                <TopItemsList items={items} />
              </CardContent>
            </Card>
          ))}
        </Refreshing>
      ) : (
        <PageState
          message={top.error || 'Loading…'}
          error={Boolean(top.error)}
          onRetry={top.reload}
          skeleton={<CardGridSkeleton count={3} className={TOP_GRID} cardClassName="h-56" />}
        />
      )}
    </>
  );
}
