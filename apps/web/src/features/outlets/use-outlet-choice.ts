'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';
import { fetchAll } from '@/lib/fetch-all';

const loadOutlets = () => fetchAll(api.listOutlets);

// Head office's choice of outlet, kept in the address (?outlet=) so it survives a reload and can be linked.
// With allowAll, no choice means all outlets; otherwise it means the first one.
export function useOutletChoice({ allowAll = false } = {}) {
  const requested = useSearchParams().get('outlet');
  const pathname = usePathname();
  const router = useRouter();
  const outlets = useApiData(loadOutlets);
  const selected =
    outlets.data?.find((outlet) => outlet.id === requested) ?? (allowAll ? undefined : outlets.data?.[0]);

  const choose = (outletId: string) => {
    const query = outletId ? `?outlet=${encodeURIComponent(outletId)}` : '';
    router.replace(`${pathname}${query}` as Route, { scroll: false });
  };

  return { outlets, selected, choose };
}
