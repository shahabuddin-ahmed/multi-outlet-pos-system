import { createHash } from "crypto";
import { UserRole } from "../constant/auth";
import { BASIS_POINTS, OrderType, PaymentMethod, RECEIPT_SEARCH_PATTERN } from "../constant/sale";
import { AuthUser } from "./auth";

// The rules of a sale that need no database

export interface SaleLineInput {
    // The menu item's public id
    menuItemId: string;
    quantity: number;
}

export interface SaleInput {
    orderType: OrderType;
    tableLabel: string | null;
    payment: { method: PaymentMethod; cashReceivedCents: number | null; reference: string | null };
    // The total the cashier showed the customer
    expectedTotalCents: number;
    items: SaleLineInput[];
}

// VAT on the subtotal, in whole minor units, rounded half up
export const vatOf = (subtotalCents: number, vatBps: number): number =>
    Math.floor((subtotalCents * vatBps + BASIS_POINTS / 2) / BASIS_POINTS);

// One line per item, in the order the items were first added
export const mergeLines = (lines: SaleLineInput[]): SaleLineInput[] => {
    const quantities = new Map<string, number>();
    for (const { menuItemId, quantity } of lines) {
        const id = menuItemId.toLowerCase();
        quantities.set(id, (quantities.get(id) ?? 0) + quantity);
    }
    return Array.from(quantities, ([menuItemId, quantity]) => ({ menuItemId, quantity }));
};

// Fingerprint of everything the client decided, to recognise a retry. Expects merged lines;
// their order does not matter.
export const requestHashOf = (outletPublicId: string, sale: SaleInput): string => {
    const lines = sale.items
        .map(({ menuItemId, quantity }) => [menuItemId, quantity] as const)
        .sort(([a], [b]) => a.localeCompare(b));
    const { method, cashReceivedCents, reference } = sale.payment;
    const canonical = JSON.stringify([
        outletPublicId,
        sale.orderType,
        sale.tableLabel,
        method,
        cashReceivedCents,
        reference,
        sale.expectedTotalCents,
        lines,
    ]);
    return createHash("sha256").update(canonical).digest("hex");
};

export interface SaleScope {
    visibleOutletId?: number;
    visibleUserId?: number;
}

// Who may see which sales. The history list and the receipt both use this one rule:
// head office sees all, a manager the own outlet, a cashier only own sales.
export const saleScopeOf = ({ id, role, outlet }: AuthUser): SaleScope => {
    if (role === UserRole.HQ_ADMIN) {
        return {};
    }
    // Staff always have an outlet (a database rule); without one this throws instead of showing everything
    const visibleOutletId = outlet!.id;
    return role === UserRole.OUTLET_MANAGER ? { visibleOutletId } : { visibleOutletId, visibleUserId: id };
};

export const canViewSale = (viewer: AuthUser, sale: { outletId: number; userId: number }): boolean => {
    const { visibleOutletId, visibleUserId } = saleScopeOf(viewer);
    return (
        (visibleOutletId === undefined || visibleOutletId === sale.outletId) &&
        (visibleUserId === undefined || visibleUserId === sale.userId)
    );
};

// "DHK-000042" or "42". The pattern is checked at the edge of the API.
export const receiptSearchOf = (text: string): { outletCode?: string; receiptNo?: number } => {
    const match = RECEIPT_SEARCH_PATTERN.exec(text);
    if (!match) {
        return {};
    }
    const [, outletCode, receiptNo] = match;
    return { outletCode: outletCode?.toUpperCase(), receiptNo: Number(receiptNo) };
};
