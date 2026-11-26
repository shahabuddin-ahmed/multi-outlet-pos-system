'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { Refreshing } from '@/components/shared/refreshing';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSkeleton } from '@/features/dashboard/dashboard-skeleton';
import { LowStockCard } from '@/features/dashboard/low-stock-card';
import { OutletBars } from '@/features/dashboard/outlet-bars';
import { StatTile } from '@/features/dashboard/stat-tile';
import { TopItemsCard } from '@/features/dashboard/top-items-card';
import { useSettings } from '@/features/settings/settings-provider';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';
import { ALL_TIME, periodQueryOf } from '@/lib/date-range';
import { fetchAll } from '@/lib/fetch-all';
import type { PeriodQuery, SalesTotals } from '@/types';

// Every outlet's figures, with the totals the API counts over all of them
async function loadRevenue(period: PeriodQuery) {
  let totals: SalesTotals = { salesCount: 0, netSalesCents: 0, vatCents: 0, totalCents: 0 };
  const outlets = await fetchAll(async (page) => {
    const report = await api.revenueByOutlet({ ...period, ...page });
    totals = report.totals;
    return report;
  });
  return { totals, outlets };
}

export function DashboardView() {
  const { money, count } = useSettings();
  const [range, setRange] = useState(ALL_TIME);
  const period = useMemo(() => periodQueryOf(range), [range]);
  const revenue = useApiData(useMemo(() => () => loadRevenue(period), [period]));
  const [chosen, setChosen] = useState('');
  const outlets = revenue.data?.outlets.map((row) => row.outlet) ?? [];
  // Until one is picked, the first outlet
  const outletId = chosen || outlets[0]?.id;

  return (
    <>
      <PageHeader title="Dashboard" text="Revenue and best sellers across all outlets">
        <DateRangePicker label="Period" value={range} onChange={setRange} />
      </PageHeader>

      {!revenue.data && (
        <PageState
          message={revenue.error || 'Loading…'}
          error={Boolean(revenue.error)}
          onRetry={revenue.reload}
          skeleton={<DashboardSkeleton />}
        />
      )}

      {revenue.data && !outletId && (
        <Card>
          <EmptyState icon={Store} title="No outlets yet" text="Create an outlet on the Outlets page first.">
            <Link href="/outlets" className={buttonVariants({ size: 'sm' })}>
              Go to outlets
            </Link>
          </EmptyState>
        </Card>
      )}

      {revenue.data && outletId && (
        // The last figures stay on screen, faded, while new ones load
        <Refreshing active={revenue.loading} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Net sales (before VAT)" value={money(revenue.data.totals.netSalesCents)} />
            <StatTile label="Sales" value={count(revenue.data.totals.salesCount)} />
            <StatTile
              label="Active outlets"
              value={`${outlets.filter((outlet) => outlet.isActive).length} of ${outlets.length}`}
            />
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
                <CardTitle>Net sales by outlet</CardTitle>
                <Link href="/reports" className="text-sm font-semibold text-primary hover:underline">
                  See the table
                </Link>
              </CardHeader>
              <CardContent>
                <OutletBars outlets={revenue.data.outlets} />
              </CardContent>
            </Card>
            <TopItemsCard outlets={outlets} outletId={outletId} onOutlet={setChosen} period={period} />
          </div>
        </Refreshing>
      )}

      <LowStockCard />
    </>
  );
}
