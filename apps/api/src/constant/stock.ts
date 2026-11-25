// Why stock changed. The database repeats these rules as CHECK constraints.
export enum StockReason {
    // Written by a sale
    SALE = "SALE",
    // A delivery arrived
    RESTOCK = "RESTOCK",
    // Spoiled, dropped or expired
    WASTE = "WASTE",
    // A count correction, up or down
    ADJUSTMENT = "ADJUSTMENT",
    // A voided sale put the items back
    VOID = "VOID",
}

// What a person may choose; SALE and VOID are only written by the system
export const MANUAL_STOCK_REASONS = [StockReason.RESTOCK, StockReason.WASTE, StockReason.ADJUSTMENT];

export const STOCK_MAX = 1_000_000;
export const STOCK_NOTE_MAX = 200;
// At or below this quantity an item is running low
export const LOW_STOCK_THRESHOLD = 5;
