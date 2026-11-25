import { AssignmentRecord } from "../../repo/assignment";
import { EffectivePrice, priceOf } from "../../service/pricing";

// Head office view of one assigned item
export interface AssignmentDto extends EffectivePrice {
    menuItemId: string;
    sku: string;
    name: string;
    basePriceCents: number;
    priceOverrideCents: number | null;
    isAvailable: boolean;
    itemIsActive: boolean;
    stock: number;
}

// Till view of one item the outlet can sell
export interface OutletMenuItemDto extends EffectivePrice {
    menuItemId: string;
    sku: string;
    name: string;
    stock: number;
    outOfStock: boolean;
}

export const toAssignmentDto = (record: AssignmentRecord): AssignmentDto => ({
    menuItemId: record.menuItemId,
    sku: record.sku,
    name: record.name,
    basePriceCents: record.basePriceCents,
    priceOverrideCents: record.priceOverrideCents,
    ...priceOf(record.basePriceCents, record.priceOverrideCents),
    isAvailable: record.isAvailable,
    itemIsActive: record.itemIsActive,
    stock: record.quantity,
});

export const toOutletMenuItemDto = (record: AssignmentRecord): OutletMenuItemDto => ({
    menuItemId: record.menuItemId,
    sku: record.sku,
    name: record.name,
    ...priceOf(record.basePriceCents, record.priceOverrideCents),
    stock: record.quantity,
    outOfStock: record.quantity === 0,
});
