'use client';

import { useMemo } from 'react';
import { PageState } from '@/components/shared/page-state';
import { Refreshing } from '@/components/shared/refreshing';
import { ListSkeleton } from '@/components/shared/skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OutletSelect } from '@/features/outlets/outlet-select';
import { TopItemsList } from '@/features/reports/top-items-list';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';
import type { PeriodQuery, ReportOutlet } from '@/types';

function OutletBestSellers({ outletId, period }: { outletId: string; period: PeriodQuery }) {
  const load = useMemo(() => () => api.topItems({ ...period, outletId, offset: 0, limit: 1 }), [period, outletId]);
  const top = useApiData(load);

  if (!top.data) {
    return (
      <PageState
        message={top.error || 'Loading…'}
        error={Boolean(top.error)}
        onRetry={top.reload}
        skeleton={<ListSkeleton />}
      />
    );
  }

  return (
    <Refreshing active={top.loading}>
      <TopItemsList items={top.data.data[0]?.items ?? []} />
    </Refreshing>
  );
}

interface TopItemsCardProps {
  outlets: ReportOutlet[];
  outletId: string;
  onOutlet: (outletId: string) => void;
  period: PeriodQuery;
}

export function TopItemsCard({ outlets, outletId, onOutlet, period }: TopItemsCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-2">
        <CardTitle>Top items</CardTitle>
        <OutletSelect outlets={outlets} value={outletId} onChange={onOutlet} />
      </CardHeader>
      <CardContent>
        {/* Another outlet starts from loading, so one outlet's items never show under another's name */}
        <OutletBestSellers key={outletId} outletId={outletId} period={period} />
      </CardContent>
    </Card>
  );
}
