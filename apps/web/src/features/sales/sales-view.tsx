'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { TableSkeleton } from '@/components/shared/skeletons';
import { OutletSelect } from '@/features/outlets/outlet-select';
import { useOutletChoice } from '@/features/outlets/use-outlet-choice';
import { SalesList } from '@/features/sales/sales-list';
import { useUser } from '@/features/session/use-user';

function HeadOfficeSales() {
  const { outlets, selected, choose } = useOutletChoice({ allowAll: true });

  if (!outlets.data) {
    return (
      <>
        <PageHeader title="Sales history" />
        <PageState
          message={outlets.error || 'Loading…'}
          error={Boolean(outlets.error)}
          onRetry={outlets.reload}
          skeleton={<TableSkeleton columns={7} />}
        />
      </>
    );
  }

  return (
    <SalesList
      key={selected?.id ?? 'all'}
      outletId={selected?.id}
      text={selected?.name ?? 'All outlets'}
      picker={<OutletSelect outlets={outlets.data} value={selected?.id ?? ''} withAll onChange={choose} />}
    />
  );
}

// Which sales come back is decided by the API: all for head office, the outlet's for a manager,
// only their own for a cashier
export function SalesView() {
  const { role, outlet } = useUser();

  if (!outlet) {
    return <HeadOfficeSales />;
  }

  const own = role === 'CASHIER' ? ' · you see only your own sales' : '';
  return <SalesList outletId={outlet.id} text={`${outlet.name}${own}`} />;
}
