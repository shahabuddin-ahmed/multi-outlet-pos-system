'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Store } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { OutletAssignments } from '@/features/assign/outlet-assignments';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';
import { fetchAll } from '@/lib/fetch-all';

const loadOutlets = () => fetchAll(api.listOutlets);

export function AssignView() {
  const requested = useSearchParams().get('outlet');
  const router = useRouter();
  const outlets = useApiData(loadOutlets);
  // The outlet in the address, otherwise the first one
  const outlet = outlets.data?.find((candidate) => candidate.id === requested) ?? outlets.data?.[0];

  return (
    <>
      <PageHeader title="Assign menu" text="Pick what each outlet sells, and at which price">
        {outlet && !outlet.isActive && <Badge variant="warn">This outlet is off</Badge>}
        {outlet && (
          <Select
            aria-label="Outlet"
            value={outlet.id}
            onChange={(event) =>
              router.replace(`/assign?outlet=${encodeURIComponent(event.target.value)}`, { scroll: false })
            }
          >
            {outlets.data?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.code})
              </option>
            ))}
          </Select>
        )}
      </PageHeader>

      {!outlets.data && (
        <PageState message={outlets.error || 'Loading…'} error={Boolean(outlets.error)} onRetry={outlets.reload} />
      )}
      {outlets.data && !outlet && (
        <Card>
          <EmptyState icon={Store} title="No outlets yet" text="Create an outlet on the Outlets page first." />
        </Card>
      )}
      {/* A new key per outlet: search, page and unsaved input start fresh */}
      {outlet && <OutletAssignments key={outlet.id} outlet={outlet} />}
    </>
  );
}
