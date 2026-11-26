'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Store } from 'lucide-react';
import { ConfirmSwitchOff } from '@/components/shared/confirm-switch-off';
import { noMatch } from '@/components/shared/empty-state';
import { ListCard } from '@/components/shared/list-card';
import { SearchInput } from '@/components/shared/search-input';
import { PageHeader } from '@/components/shared/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { OutletForm } from '@/features/outlets/outlet-form';
import { useActiveSwitch, withRow } from '@/hooks/use-active-switch';
import { usePagedSearch } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import type { Outlet } from '@/types';

const setActive = (id: string, isActive: boolean) => api.updateOutlet(id, { isActive });

export function OutletsView() {
  const list = usePagedSearch(api.listOutlets);
  // 'new' or the outlet being edited
  const [editing, setEditing] = useState<Outlet | 'new' | null>(null);
  const active = useActiveSwitch(setActive, (saved) => list.update((page) => withRow(page, saved)));

  return (
    <>
      <PageHeader title="Outlets" text="Each outlet has its own stock and its own receipt numbers">
        <SearchInput label="Search outlets" value={list.search} onChange={list.setSearch} />
        <Button onClick={() => setEditing('new')}>
          <Plus aria-hidden="true" className="size-4" />
          New outlet
        </Button>
      </PageHeader>

      <ListCard
        page={list.data}
        error={list.error}
        loading={list.loading}
        columns={6}
        onRetry={list.reload}
        onPage={list.setOffset}
        empty={
          list.searching
            ? noMatch('No outlet has this name or code.', () => list.setSearch(''))
            : {
                icon: Store,
                title: 'No outlets yet',
                text: 'Create the first one to start.',
                children: (
                  <Button size="sm" onClick={() => setEditing('new')}>
                    <Plus aria-hidden="true" className="size-4" />
                    New outlet
                  </Button>
                )
              }
        }
      >
        <Table>
          <TableHead>
            <Th>Code</Th>
            <Th>Name</Th>
            <Th>Address</Th>
            <Th>Phone</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </TableHead>
          <tbody>
            {list.data?.data.map((outlet) => (
              <Row key={outlet.id}>
                <Td className="font-semibold">{outlet.code}</Td>
                <Td>{outlet.name}</Td>
                <Td className="text-muted-foreground">{outlet.address ?? '—'}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{outlet.phone ?? '—'}</Td>
                <Td>
                  <Switch
                    aria-label={`Active: ${outlet.name}`}
                    checked={outlet.isActive}
                    disabled={active.savingId === outlet.id}
                    onChange={(event) => active.toggle(outlet, event.target.checked)}
                    onText="Active"
                    offText="Off"
                  />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(outlet)}>
                      Edit
                    </Button>
                    <Link
                      href={{ pathname: '/assign', query: { outlet: outlet.id } }}
                      className={buttonVariants({ variant: 'outline', size: 'sm', className: 'whitespace-nowrap' })}
                    >
                      Assign menu
                    </Link>
                  </div>
                </Td>
              </Row>
            ))}
          </tbody>
        </Table>
      </ListCard>

      <p className="text-xs text-muted-foreground">
        Staff accounts are created with the command <code>yarn user:create</code> (see the README). There is no staff
        screen in this version.
      </p>

      {editing && (
        <OutletForm
          outlet={editing === 'new' ? undefined : editing}
          onSaved={list.reload}
          onClose={() => setEditing(null)}
        />
      )}
      {active.asking && (
        <ConfirmSwitchOff
          name={active.asking.name}
          effect="It cannot make new sales until it is switched on again. Stock, old receipts and reports are kept."
          busy={Boolean(active.savingId)}
          onKeep={active.keep}
          onSwitchOff={active.switchOff}
        />
      )}
    </>
  );
}
