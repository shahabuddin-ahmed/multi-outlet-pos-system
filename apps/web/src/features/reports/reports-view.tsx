'use client';

import { useMemo, useState } from 'react';
import { ListCard } from '@/components/shared/list-card';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PeriodFilter } from '@/features/reports/period-filter';
import { RevenueTable } from '@/features/reports/revenue-table';
import { TopItemsList } from '@/features/reports/top-items-list';
import { usePeriod } from '@/features/reports/use-period';
import { useApiData } from '@/hooks/use-api-data';
import { LIST_PAGE_SIZE } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function ReportsView() {
  const period = usePeriod();
  const [offset, setOffset] = useState(0);

  // Both show the same page of outlets, in the same order
  const query = useMemo(() => ({ ...period.query, offset, limit: LIST_PAGE_SIZE }), [period.query, offset]);
  const revenue = useApiData(useMemo(() => () => api.revenueByOutlet(query), [query]));
  const top = useApiData(useMemo(() => () => api.topItems(query), [query]));

  return (
    <>
      <PageHeader title="Reports" text="Revenue by outlet and the best sellers of each">
        <PeriodFilter period={period} />
      </PageHeader>

      {/* The last figures stay on screen, faded, while new ones load */}
      <div aria-busy={revenue.loading} className={cn(revenue.loading && revenue.data && 'opacity-60')}>
        <ListCard
          page={revenue.data}
          error={revenue.error}
          onRetry={revenue.reload}
          onPage={setOffset}
          empty={{ title: 'No outlets yet', text: 'Create an outlet on the Outlets page first.' }}
        >
          {revenue.data && <RevenueTable report={revenue.data} />}
        </ListCard>
      </div>

      {/* Left out while the table shows an error, so one problem is told once */}
      {revenue.error ? null : top.data ? (
        <div
          aria-busy={top.loading}
          className={cn('grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4', top.loading && 'opacity-60')}
        >
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
        </div>
      ) : (
        <PageState message={top.error || 'Loading…'} error={Boolean(top.error)} onRetry={top.reload} />
      )}
    </>
  );
}
