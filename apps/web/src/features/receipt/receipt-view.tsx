'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReceiptPanel } from '@/features/receipt/receipt-panel';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';

// An earlier sale's receipt: anything printed from here is a copy. The API decides who may open it.
export function ReceiptView({ outletId, saleId }: { outletId: string; saleId: string }) {
  const load = useMemo(() => () => api.receipt(outletId, saleId), [outletId, saleId]);
  const { data, error, reload } = useApiData(load);

  return (
    <>
      <PageHeader title={data ? `Receipt ${data.receiptCode}` : 'Receipt'}>
        <Link href="/sales" className={buttonVariants({ variant: 'outline' })}>
          Back to sales history
        </Link>
      </PageHeader>

      {data ? (
        <Card className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
          <ReceiptPanel receipt={data} />
        </Card>
      ) : (
        <PageState message={error || 'Loading…'} error={Boolean(error)} onRetry={reload} />
      )}
    </>
  );
}
