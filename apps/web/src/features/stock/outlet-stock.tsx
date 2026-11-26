'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ListCard, SearchInput } from '@/components/shared/list-card';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { StockChangeDialog } from '@/features/stock/stock-change-dialog';
import { StockHistoryDialog } from '@/features/stock/stock-history-dialog';
import { usePagedSearch } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import type { ListQuery, ManualStockReason, StockLine } from '@/types';

const ACTIONS: { label: string; reason: ManualStockReason }[] = [
  { label: 'Restock', reason: 'RESTOCK' },
  { label: 'Correct', reason: 'ADJUSTMENT' },
  { label: 'Waste', reason: 'WASTE' }
];

// Low and out of stock are decided by the API
function StockStatus({ line }: { line: StockLine }) {
  if (line.outOfStock) {
    return <Badge variant="error">Out</Badge>;
  }
  return line.lowStock ? <Badge variant="warn">Low</Badge> : <Badge variant="ok">OK</Badge>;
}

interface OutletStockProps {
  outletId: string;
  outletName: string;
  // Head office's choice of outlet
  picker?: ReactNode;
}

export function OutletStock({ outletId, outletName, picker }: OutletStockProps) {
  const loadPage = useCallback((query: ListQuery) => api.listStock(outletId, query), [outletId]);
  const list = usePagedSearch(loadPage);
  const [changing, setChanging] = useState<{ line: StockLine; reason: ManualStockReason } | null>(null);
  const [viewing, setViewing] = useState<StockLine | null>(null);

  return (
    <>
      <PageHeader title="Stock" text={`Stock of ${outletName}. It can never go below 0.`}>
        <SearchInput label="Search items" value={list.search} onChange={list.setSearch} />
        {picker}
      </PageHeader>

      <ListCard
        page={list.data}
        error={list.error}
        onRetry={list.reload}
        onPage={list.setOffset}
        empty={
          list.searching
            ? { title: 'Nothing matches' }
            : { title: 'No items assigned', text: 'Head office assigns menu items to an outlet first.' }
        }
      >
        <Table>
          <TableHead>
            <Th>Item</Th>
            <Th className="text-right">In stock</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </TableHead>
          <tbody>
            {list.data?.data.map((line) => (
              <Row key={line.menuItemId}>
                <Td>
                  <span className="font-semibold">{line.name}</span> {!line.isSellable && <Badge>Not on sale</Badge>}
                  <span className="block text-xs text-muted-foreground">{line.sku}</span>
                </Td>
                <Td className="text-right font-semibold tabular-nums">{line.stock}</Td>
                <Td>
                  <StockStatus line={line} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    {ACTIONS.map(({ label, reason }) => (
                      <Button
                        key={reason}
                        variant="outline"
                        size="sm"
                        aria-label={`${label} ${line.name}`}
                        onClick={() => setChanging({ line, reason })}
                      >
                        {label}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`History of ${line.name}`}
                      onClick={() => setViewing(line)}
                    >
                      History
                    </Button>
                  </div>
                </Td>
              </Row>
            ))}
          </tbody>
        </Table>
      </ListCard>

      {changing && (
        <StockChangeDialog
          outletId={outletId}
          line={changing.line}
          reason={changing.reason}
          onDone={() => {
            setChanging(null);
            list.reload();
          }}
        />
      )}
      {viewing && <StockHistoryDialog outletId={outletId} line={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
