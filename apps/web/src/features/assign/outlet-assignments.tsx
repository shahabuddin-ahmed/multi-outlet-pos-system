'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import { noMatch } from '@/components/shared/empty-state';
import { ListCard } from '@/components/shared/list-card';
import { SearchInput } from '@/components/shared/search-input';
import { PageState } from '@/components/shared/page-state';
import { buttonVariants } from '@/components/ui/button';
import { Table, TableHead, Th } from '@/components/ui/table';
import { AssignmentRow } from '@/features/assign/assignment-row';
import { useApiData } from '@/hooks/use-api-data';
import { usePagedSearch } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import { fetchAll } from '@/lib/fetch-all';
import type { Assignment, Outlet } from '@/types';

// The master menu, page by page, with what this outlet has of it
export function OutletAssignments({ outlet }: { outlet: Outlet }) {
  const items = usePagedSearch(api.listMenuItems);
  const loadAssigned = useMemo(() => () => fetchAll((query) => api.listAssignments(outlet.id, query)), [outlet.id]);
  const assigned = useApiData(loadAssigned);
  const byItem = useMemo(
    () => new Map(assigned.data?.map((assignment) => [assignment.menuItemId, assignment])),
    [assigned.data]
  );

  const keep = (saved: Assignment) =>
    assigned.update((rows) => [...rows.filter((row) => row.menuItemId !== saved.menuItemId), saved]);

  if (assigned.error) {
    return <PageState message={assigned.error} error onRetry={assigned.reload} />;
  }

  return (
    <>
      <SearchInput label="Search items" value={items.search} onChange={items.setSearch} />
      <ListCard
        page={assigned.data ? items.data : null}
        error={items.error}
        loading={items.loading}
        columns={7}
        onRetry={items.reload}
        onPage={items.setOffset}
        empty={
          items.searching
            ? noMatch('No item has this name or SKU.', () => items.setSearch(''))
            : {
                icon: UtensilsCrossed,
                title: 'No menu items yet',
                text: 'Create items on the Menu items page first.',
                children: (
                  <Link href="/menu-items" className={buttonVariants({ size: 'sm' })}>
                    Go to menu items
                  </Link>
                )
              }
        }
      >
        <Table>
          <TableHead>
            <Th>Item</Th>
            <Th className="text-right">Master price</Th>
            <Th>Outlet price</Th>
            <Th>Price source</Th>
            <Th>On</Th>
            <Th className="text-right">Customer pays</Th>
            <Th className="text-right">Stock</Th>
          </TableHead>
          <tbody>
            {items.data?.data.map((item) => (
              <AssignmentRow
                key={item.id}
                outletId={outlet.id}
                item={item}
                assignment={byItem.get(item.id)}
                onSaved={keep}
              />
            ))}
          </tbody>
        </Table>
      </ListCard>
      <p className="text-xs text-muted-foreground">
        Each change saves at once. An empty outlet price follows the master price. {outlet.name} has{' '}
        {assigned.data?.length ?? 0} items assigned.
      </p>
    </>
  );
}
