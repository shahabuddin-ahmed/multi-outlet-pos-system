import { ORDER_TYPE_LABELS, PAYMENT_LABELS } from '@/lib/labels';
import { vatLabel } from '@/lib/estimate';
import { newFormatters } from '@/lib/format';
import type { Receipt } from '@/types';

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={bold ? 'flex justify-between gap-2 font-bold' : 'flex justify-between gap-2'}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

const Rule = () => <hr className="my-2 border-t border-dashed border-black" />;

// The receipt as printed on 80 mm paper. Everything comes from what was saved with the sale, including
// the currency and time zone, so an old receipt never changes.
export function ReceiptPaper({ receipt, copy }: { receipt: Receipt; copy: boolean }) {
  const { header, payment } = receipt;
  const { money, dateTime } = newFormatters(header);
  const order = ORDER_TYPE_LABELS[receipt.orderType];

  return (
    <div className="mx-auto w-full max-w-[320px] bg-white p-1.5 font-mono text-[13px] leading-snug text-black">
      <div className="text-center">
        <div className="font-bold">{header.companyName}</div>
        <div>{header.companyTaxNo}</div>
        <div>
          {header.outlet.name} ({header.outlet.code})
        </div>
        <div>{header.outlet.address}</div>
        <div>{header.outlet.phone}</div>
      </div>
      <Rule />
      {copy && <div className="text-center font-bold">*** COPY ***</div>}
      <Line label="Receipt" value={receipt.receiptCode} bold />
      <Line label="Date" value={dateTime(receipt.createdAt)} />
      <Line label="Order" value={receipt.tableLabel ? `${order} · ${receipt.tableLabel}` : order} />
      <Line label="Cashier" value={header.cashierName} />
      <Rule />
      {receipt.items.map((item) => (
        <div key={item.menuItemId}>
          <div>{item.name}</div>
          <div className="pl-3">
            <Line label={`${item.quantity} x ${money(item.unitPriceCents)}`} value={money(item.lineTotalCents)} />
          </div>
        </div>
      ))}
      <Rule />
      <Line label="Subtotal" value={money(receipt.subtotalCents)} />
      <Line label={`VAT ${vatLabel(receipt.vatBps)}`} value={money(receipt.vatCents)} />
      <Line label="TOTAL" value={money(receipt.totalCents)} bold />
      <Rule />
      {payment.cashReceivedCents !== null ? (
        <>
          <Line label="Cash received" value={money(payment.cashReceivedCents)} />
          <Line label="Change" value={money(payment.changeCents ?? 0)} />
        </>
      ) : (
        <>
          <Line label={PAYMENT_LABELS[payment.method]} value={money(receipt.totalCents)} />
          {payment.reference && <Line label="Reference" value={payment.reference} />}
        </>
      )}
      <div className="text-center text-[11px]">Payment recorded</div>
      <Rule />
      <div className="text-center">{header.footer}</div>
    </div>
  );
}
