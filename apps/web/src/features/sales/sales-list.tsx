'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ListCard, SearchInput } from '@/components/shared/list-card';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { useSettings } from '@/features/settings/settings-provider';
import { useApiData } from '@/hooks/use-api-data';
import { useDebounced } from '@/hooks/use-debounced';
import { LIST_PAGE_SIZE } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import { ORDER_TYPE_LABELS, PAYMENT_LABELS } from '@/lib/labels';

interface SalesListProps {
  // Left out: every outlet (head office)
  outletId?: string;
  text: string;
  // Head office's choice of outlet
  picker?: ReactNode;
}

export function SalesList({ outletId, text, picker }: SalesListProps) {
  const { money, dateTime } = useSettings();
  const [filters, setFilters] = useState({ receipt: '', from: '', to: '' });
  const [offset, setOffset] = useState(0);
  // Each waits until typing stops, so half a receipt number or date is not searched
  const receipt = useDebounced(filters.receipt.trim());
  const from = useDebounced(filters.from);
  const to = useDebounced(filters.to);

  const load = useMemo(
    () => () => {
      const query = { offset, limit: LIST_PAGE_SIZE, receipt, from, to };
      return outletId ? api.listOutletSales(outletId, query) : api.listSales(query);
    },
    [outletId, offset, receipt, from, to]
  );
  const list = useApiData(load);

  // A new filter starts on the first page
  const filter = (changes: Partial<typeof filters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setOffset(0);
  };
  const filtered = Boolean(receipt || from || to);

  return (
    <>
      <PageHeader title="Sales history" text={text}>
        {picker}
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3">
        <SearchInput
          label="Receipt number, e.g. DHK-000042 or 42"
          value={filters.receipt}
          onChange={(value) => filter({ receipt: value })}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          From
          <Input
            type="date"
            className="w-auto"
            value={filters.from}
            onChange={(event) => filter({ from: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          To
          <Input
            type="date"
            className="w-auto"
            value={filters.to}
            onChange={(event) => filter({ to: event.target.value })}
          />
        </label>
        <span className="pb-2.5 text-xs text-muted-foreground">Search by receipt number, e.g. DHK-000042 or 42</span>
      </div>

      <ListCard
        page={list.data}
        error={list.error}
        onRetry={list.reload}
        onPage={setOffset}
        empty={
          filtered
            ? { title: 'No sale matches', text: 'Check the receipt number or the dates.' }
            : { title: 'No sales yet' }
        }
      >
        <Table>
          <TableHead>
            {!outletId && <Th>Outlet</Th>}
            <Th>Receipt</Th>
            <Th>Time</Th>
            <Th>Type</Th>
            <Th className="text-right">Items</Th>
            <Th className="text-right">Total</Th>
            <Th>Payment</Th>
            <Th>Cashier</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </TableHead>
          <tbody>
            {list.data?.data.map((sale) => (
              <Row key={sale.id}>
                {!outletId && <Td>{sale.outlet.name}</Td>}
                <Td className="font-semibold whitespace-nowrap">{sale.receiptCode}</Td>
                <Td className="whitespace-nowrap">{dateTime(sale.createdAt)}</Td>
                <Td className="whitespace-nowrap">
                  {ORDER_TYPE_LABELS[sale.orderType]}
                  {sale.tableLabel && ` · ${sale.tableLabel}`}
                </Td>
                <Td className="text-right tabular-nums">{sale.itemCount}</Td>
                <Td className="text-right whitespace-nowrap tabular-nums">{money(sale.totalCents)}</Td>
                <Td className="whitespace-nowrap">{PAYMENT_LABELS[sale.paymentMethod]}</Td>
                <Td className="whitespace-nowrap">{sale.cashierName}</Td>
                <Td className="text-right">
                  <Link
                    href={`/sales/${sale.outlet.id}/${sale.id}`}
                    aria-label={`View receipt ${sale.receiptCode}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    View
                  </Link>
                </Td>
              </Row>
            ))}
          </tbody>
        </Table>
      </ListCard>
    </>
  );
}
