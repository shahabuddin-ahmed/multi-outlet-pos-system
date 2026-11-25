'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ConfirmSwitchOff } from '@/components/shared/confirm-switch-off';
import { ListCard, SearchInput } from '@/components/shared/list-card';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { MenuItemForm } from '@/features/menu-items/menu-item-form';
import { useSettings } from '@/features/settings/settings-provider';
import { useActiveSwitch, withRow } from '@/hooks/use-active-switch';
import { usePagedSearch } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import type { MenuItem } from '@/types';

const setActive = (id: string, isActive: boolean) => api.updateMenuItem(id, { isActive });

export function MenuItemsView() {
  const { money } = useSettings();
  const list = usePagedSearch(api.listMenuItems);
  // 'new' or the item being edited
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null);
  const active = useActiveSwitch(setActive, (saved) => list.update((page) => withRow(page, saved)));

  return (
    <>
      <PageHeader
        title="Menu items"
        text="The master menu. Outlets get items from here, with their own price if needed."
      >
        <SearchInput label="Search items" value={list.search} onChange={list.setSearch} />
        <Button onClick={() => setEditing('new')}>
          <Plus aria-hidden="true" className="size-4" />
          New item
        </Button>
      </PageHeader>

      <ListCard
        page={list.data}
        error={list.error}
        onRetry={list.reload}
        onPage={list.setOffset}
        empty={
          list.searching
            ? { title: 'Nothing matches' }
            : { title: 'No items yet', text: 'Create the first one to start.' }
        }
      >
        <Table>
          <TableHead>
            <Th>SKU</Th>
            <Th>Name</Th>
            <Th className="text-right">Base price</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </TableHead>
          <tbody>
            {list.data?.data.map((item) => (
              <Row key={item.id}>
                <Td className="font-semibold whitespace-nowrap">{item.sku}</Td>
                <Td>{item.name}</Td>
                <Td className="text-right whitespace-nowrap tabular-nums">{money(item.basePriceCents)}</Td>
                <Td>
                  <Switch
                    aria-label={`Active: ${item.name}`}
                    checked={item.isActive}
                    disabled={active.savingId === item.id}
                    onChange={(event) => active.toggle(item, event.target.checked)}
                    onText="Active"
                    offText="Off"
                  />
                </Td>
                <Td className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setEditing(item)}>
                    Edit
                  </Button>
                </Td>
              </Row>
            ))}
          </tbody>
        </Table>
      </ListCard>

      {editing && (
        <MenuItemForm
          item={editing === 'new' ? undefined : editing}
          onSaved={list.reload}
          onClose={() => setEditing(null)}
        />
      )}
      {active.asking && (
        <ConfirmSwitchOff
          name={active.asking.name}
          effect="No outlet can sell it until it is switched on again. Old receipts and reports are kept."
          busy={Boolean(active.savingId)}
          onKeep={active.keep}
          onSwitchOff={active.switchOff}
        />
      )}
    </>
  );
}
