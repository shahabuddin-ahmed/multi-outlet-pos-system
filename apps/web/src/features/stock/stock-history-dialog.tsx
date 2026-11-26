'use client';

import { useCallback } from 'react';
import { History } from 'lucide-react';
import { ListCard } from '@/components/shared/list-card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { useSettings } from '@/features/settings/settings-provider';
import { usePagedSearch } from '@/hooks/use-paged-search';
import { api } from '@/lib/api';
import { STOCK_REASON_LABELS } from '@/lib/labels';
import type { ListQuery, StockLine } from '@/types';

interface StockHistoryDialogProps {
  outletId: string;
  line: StockLine;
  onClose: () => void;
}

export function StockHistoryDialog({ outletId, line, onClose }: StockHistoryDialogProps) {
  const { dateTime } = useSettings();
  const loadPage = useCallback(
    (query: ListQuery) => api.stockHistory(outletId, line.menuItemId, query),
    [outletId, line.menuItemId]
  );
  const list = usePagedSearch(loadPage);

  return (
    <Dialog title={`Stock history · ${line.name}`} wide onClose={onClose}>
      <ListCard
        page={list.data}
        error={list.error}
        loading={list.loading}
        columns={6}
        onRetry={list.reload}
        onPage={list.setOffset}
        empty={{
          icon: History,
          title: 'No changes yet',
          text: 'Restocks, corrections, waste and sales are listed here.'
        }}
      >
        <Table>
          <TableHead>
            <Th>Time</Th>
            <Th className="text-right">Change</Th>
            <Th className="text-right">After</Th>
            <Th>Reason</Th>
            <Th>By</Th>
            <Th>Receipt or note</Th>
          </TableHead>
          <tbody>
            {list.data?.data.map((movement) => (
              <Row key={movement.id}>
                <Td className="whitespace-nowrap">{dateTime(movement.createdAt)}</Td>
                <Td className="text-right tabular-nums">
                  {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                </Td>
                <Td className="text-right tabular-nums">{movement.quantityAfter}</Td>
                <Td>
                  <Badge variant={movement.reason === 'WASTE' ? 'warn' : 'default'}>
                    {STOCK_REASON_LABELS[movement.reason]}
                  </Badge>
                </Td>
                <Td>{movement.userName ?? '—'}</Td>
                <Td className="text-muted-foreground">{movement.receiptCode ?? movement.note ?? '—'}</Td>
              </Row>
            ))}
          </tbody>
        </Table>
      </ListCard>
    </Dialog>
  );
}
