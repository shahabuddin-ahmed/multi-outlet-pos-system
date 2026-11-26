'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageState } from '@/components/shared/page-state';
import { Pager } from '@/components/shared/pager';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';

const ROWS_PER_PAGE = 10;
// Only named in the title: LOW_STOCK_THRESHOLD in the API is what picks the rows
const LOW_STOCK = 5;

// Stock as it is now, so the period above does not apply. Which items count as low is decided by the API.
export function LowStockCard() {
  const [offset, setOffset] = useState(0);
  const load = useMemo(() => () => api.lowStock({ offset, limit: ROWS_PER_PAGE }), [offset]);
  const list = useApiData(load);

  if (!list.data) {
    return <PageState message={list.error || 'Loading…'} error={Boolean(list.error)} onRetry={list.reload} />;
  }
  const { data, limit, total } = list.data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Low stock ({LOW_STOCK} or fewer)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Stock right now, whatever the period: items on sale at active outlets. Restock from the Stock page.
        </p>
      </CardHeader>
      {total === 0 ? (
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">No item is low on stock.</p>
        </CardContent>
      ) : (
        <>
          <Table>
            <TableHead>
              <Th>Outlet</Th>
              <Th>Item</Th>
              <Th className="text-right">In stock</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </TableHead>
            <tbody>
              {data.map((line) => (
                <Row key={`${line.outlet.id}:${line.menuItemId}`}>
                  <Td className="whitespace-nowrap">
                    {line.outlet.name} <span className="text-muted-foreground">{line.outlet.code}</span>
                  </Td>
                  <Td>{line.name}</Td>
                  <Td className="text-right font-semibold tabular-nums">{line.stock}</Td>
                  <Td>{line.outOfStock ? <Badge variant="error">Out</Badge> : <Badge variant="warn">Low</Badge>}</Td>
                  <Td className="text-right">
                    <Link
                      href={`/stock?outlet=${line.outlet.id}`}
                      aria-label={`Open stock of ${line.outlet.name}`}
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      Open stock
                    </Link>
                  </Td>
                </Row>
              ))}
            </tbody>
          </Table>
          <div className="border-t px-4 py-3">
            <Pager offset={offset} limit={limit} total={total} onChange={setOffset} />
          </div>
        </>
      )}
    </Card>
  );
}
