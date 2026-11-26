'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ReceiptText } from 'lucide-react';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { noMatch } from '@/components/shared/empty-state';
import { ListCard } from '@/components/shared/list-card';
import { SearchInput } from '@/components/shared/search-input';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { useUser } from '@/features/session/use-user';
import { useSettings } from '@/features/settings/settings-provider';
import { useApiData } from '@/hooks/use-api-data';
import { useDebounced } from '@/hooks/use-debounced';
import { LIST_PAGE_SIZE } from '@/hooks/use-paged-search';
import { canOpen } from '@/lib/access';
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
  const { role } = useUser();
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
        loading={list.loading}
        columns={outletId ? 6 : 7}
        onRetry={list.reload}
        onPage={setOffset}
        empty={
          filtered
            ? noMatch(
                'Check the receipt number or the dates.',
                () => filter({ receipt: '', range: ALL_TIME }),
                'Clear filters'
              )
            : {
                icon: ReceiptText,
                title: 'No sales yet',
                text: 'A sale is listed here as soon as it is completed.',
                children: canOpen(role, '/till') && (
                  <Link href="/till" className={buttonVariants({ size: 'sm' })}>
                    Open the till
                  </Link>
                )
              }
        }
      >
        <Table>
          <TableHead>
            <Th>Receipt</Th>
            {!outletId && <Th>Outlet</Th>}
            <Th>Time</Th>
            <Th className="text-right">Items</Th>
            <Th className="text-right">Total</Th>
            <Th>Cashier</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </TableHead>
          <tbody>
            {list.data?.data.map((sale) => (
              // Two facts share a cell, so that every column fits beside the menu
              <Row key={sale.id}>
                <Td className="whitespace-nowrap">
                  <span className="font-semibold">{sale.receiptCode}</span>
                  <span className="block text-xs text-muted-foreground">
                    {ORDER_TYPE_LABELS[sale.orderType]}
                    {sale.tableLabel && ` · ${sale.tableLabel}`}
                  </span>
                </Td>
                {!outletId && <Td>{sale.outlet.name}</Td>}
                <Td className="whitespace-nowrap">{dateTime(sale.createdAt)}</Td>
                <Td className="text-right tabular-nums">{sale.itemCount}</Td>
                <Td className="text-right whitespace-nowrap">
                  <span className="font-semibold tabular-nums">{money(sale.totalCents)}</span>
                  <span className="block text-xs text-muted-foreground">{PAYMENT_LABELS[sale.paymentMethod]}</span>
                </Td>
                <Td>{sale.cashierName}</Td>
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
