import { OrderType, PaymentMethod } from "../../constant/sale";
import { ReceiptSnapshot, SaleItemRecord, SaleRecord, SaleSummaryRecord } from "../../repo/sale";
import { receiptCodeOf } from "../../utils/utility";

// Everything a receipt prints. The header comes from the snapshot saved with the sale.
export interface ReceiptDto {
    id: string;
    receiptCode: string;
    receiptNumber: number;
    createdAt: Date;
    orderType: OrderType;
    tableLabel: string | null;
    items: SaleItemRecord[];
    subtotalCents: number;
    vatBps: number;
    vatCents: number;
    totalCents: number;
    payment: {
        method: PaymentMethod;
        reference: string | null;
        cashReceivedCents: number | null;
        changeCents: number | null;
    };
    header: ReceiptSnapshot;
}

export interface SaleSummaryDto {
    id: string;
    receiptCode: string;
    createdAt: Date;
    orderType: OrderType;
    tableLabel: string | null;
    paymentMethod: PaymentMethod;
    totalCents: number;
    itemCount: number;
    cashierName: string;
    outlet: { id: string; code: string; name: string };
}

export const toReceiptDto = (sale: SaleRecord): ReceiptDto => ({
    id: sale.publicId,
    receiptCode: receiptCodeOf(sale.snapshot.outlet.code, sale.receiptNo),
    receiptNumber: sale.receiptNo,
    createdAt: sale.createdAt,
    orderType: sale.orderType,
    tableLabel: sale.tableLabel,
    items: sale.items.map(({ menuItemId, name, sku, quantity, unitPriceCents, lineTotalCents }) => ({
        menuItemId,
        name,
        sku,
        quantity,
        unitPriceCents,
        lineTotalCents,
    })),
    subtotalCents: sale.subtotalCents,
    vatBps: sale.vatBps,
    vatCents: sale.vatCents,
    totalCents: sale.totalCents,
    payment: {
        method: sale.paymentMethod,
        reference: sale.paymentReference,
        cashReceivedCents: sale.tenderedCents,
        changeCents: sale.tenderedCents === null ? null : sale.tenderedCents - sale.totalCents,
    },
    header: sale.snapshot,
});

export const toSaleSummaryDto = (sale: SaleSummaryRecord): SaleSummaryDto => ({
    id: sale.publicId,
    receiptCode: receiptCodeOf(sale.snapshot.outlet.code, sale.receiptNo),
    createdAt: sale.createdAt,
    orderType: sale.orderType,
    tableLabel: sale.tableLabel,
    paymentMethod: sale.paymentMethod,
    totalCents: sale.totalCents,
    itemCount: sale.itemCount,
    cashierName: sale.snapshot.cashierName,
    outlet: { id: sale.outletPublicId, code: sale.snapshot.outlet.code, name: sale.snapshot.outlet.name },
});
