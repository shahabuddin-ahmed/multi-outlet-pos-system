import { LOW_STOCK_THRESHOLD, StockReason } from "../../constant/stock";
import { LowStockRecord, MovementRecord, StockRecord } from "../../repo/inventory";
import { receiptCodeOf } from "../../utils/utility";

export interface StockDto {
    menuItemId: string;
    sku: string;
    name: string;
    stock: number;
    lowStock: boolean;
    outOfStock: boolean;
    isSellable: boolean;
    updatedAt: Date;
}

export interface StockMovementDto {
    id: string;
    delta: number;
    quantityAfter: number;
    reason: StockReason;
    userName: string | null;
    note: string | null;
    // Set when a sale caused the movement
    receiptCode: string | null;
    createdAt: Date;
}

export interface LowStockDto {
    outlet: { id: string; code: string; name: string };
    menuItemId: string;
    sku: string;
    name: string;
    stock: number;
    outOfStock: boolean;
}

export const toStockDto = (record: StockRecord): StockDto => ({
    menuItemId: record.menuItemId,
    sku: record.sku,
    name: record.name,
    stock: record.quantity,
    lowStock: record.quantity <= LOW_STOCK_THRESHOLD,
    outOfStock: record.quantity === 0,
    isSellable: record.isSellable,
    updatedAt: record.updatedAt,
});

export const toStockMovementDto = (record: MovementRecord): StockMovementDto => ({
    id: record.publicId,
    delta: record.delta,
    quantityAfter: record.quantityAfter,
    reason: record.reason,
    userName: record.userName,
    note: record.note,
    receiptCode:
        record.outletCode && record.receiptNo !== null ? receiptCodeOf(record.outletCode, record.receiptNo) : null,
    createdAt: record.createdAt,
});

export const toLowStockDto = (record: LowStockRecord): LowStockDto => ({
    outlet: { id: record.outletId, code: record.outletCode, name: record.outletName },
    menuItemId: record.menuItemId,
    sku: record.sku,
    name: record.name,
    stock: record.quantity,
    outOfStock: record.quantity === 0,
});
