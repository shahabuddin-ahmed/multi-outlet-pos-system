'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { ListCard } from '@/components/shared/list-card';
import { SearchInput } from '@/components/shared/search-input';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { useSettings } from '@/features/settings/settings-provider';
import { useApiData } from '@/hooks/use-api-data';
import { useDebounced } from '@/hooks/use-debounced';
import { LIST_PAGE_SIZE } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import { ALL_TIME } from '@/lib/date-range';
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
  const [filters, setFilters] = useState({ receipt: '', range: ALL_TIME });
  const [offset, setOffset] = useState(0);
  // Waits until typing stops, so half a receipt number is not searched
  const receipt = useDebounced(filters.receipt.trim());
  const { from, to } = filters.range;

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

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          label="Search by receipt number"
          placeholder="DHK-000042 or 42"
          value={filters.receipt}
          onChange={(value) => filter({ receipt: value })}
        />
        <DateRangePicker
          label="Sale dates"
          align="start"
          value={filters.range}
          onChange={(range) => filter({ range })}
        />
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
