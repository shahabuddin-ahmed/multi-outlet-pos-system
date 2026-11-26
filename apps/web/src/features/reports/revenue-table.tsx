import { Row, Table, TableHead, Td, Th } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/features/settings/settings-provider';
import type { RevenueReport } from '@/types';

const NUMBER_CELL = 'text-right whitespace-nowrap tabular-nums';

export function RevenueTable({ report }: { report: RevenueReport }) {
  const { money, count } = useSettings();
  const { totals } = report;

  return (
    <Table>
      <TableHead>
        <Th>Outlet</Th>
        <Th className="text-right">Sales</Th>
        <Th className="text-right">Net sales</Th>
        <Th className="text-right">VAT</Th>
        <Th className="text-right">Total</Th>
      </TableHead>
      <tbody>
        {report.data.map(({ outlet, ...row }) => (
          <Row key={outlet.id}>
            <Td>
              <span className="font-semibold">{outlet.name}</span>{' '}
              <span className="text-muted-foreground">{outlet.code}</span> {!outlet.isActive && <Badge>Off</Badge>}
            </Td>
            <Td className={NUMBER_CELL}>{count(row.salesCount)}</Td>
            <Td className={NUMBER_CELL}>{money(row.netSalesCents)}</Td>
            <Td className={NUMBER_CELL}>{money(row.vatCents)}</Td>
            <Td className={NUMBER_CELL}>{money(row.totalCents)}</Td>
          </Row>
        ))}
      </tbody>
      <tfoot className="border-t-2 font-semibold">
        <tr>
          <Th scope="row">All outlets</Th>
          <Td className={NUMBER_CELL}>{count(totals.salesCount)}</Td>
          <Td className={NUMBER_CELL}>{money(totals.netSalesCents)}</Td>
          <Td className={NUMBER_CELL}>{money(totals.vatCents)}</Td>
          <Td className={NUMBER_CELL}>{money(totals.totalCents)}</Td>
        </tr>
      </tfoot>
    </Table>
  );
}
