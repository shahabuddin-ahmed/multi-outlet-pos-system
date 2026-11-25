export enum OrderType {
    DINE_IN = "DINE_IN",
    TAKEAWAY = "TAKEAWAY",
    DELIVERY = "DELIVERY",
}

// How the customer paid. The payment is recorded, not processed: no payment provider is connected.
export enum PaymentMethod {
    CASH = "CASH",
    CARD = "CARD",
    MOBILE_BANKING = "MOBILE_BANKING",
}

// The database repeats the quantity limit as a CHECK constraint
export const SALE_LIMITS = {
    LINES_MAX: 50,
    QUANTITY_MAX: 1000,
    TABLE_MAX: 20,
    REFERENCE_MAX: 40,
} as const;

// VAT is stored in basis points: 10,000 is 100%
export const BASIS_POINTS = 10_000;

// DHK-000042: the outlet code and the outlet's own sequence number
export const RECEIPT_NUMBER_DIGITS = 6;
// Search accepts the full receipt code or only the number
export const RECEIPT_SEARCH_PATTERN = /^(?:([A-Za-z0-9]{2,10})-)?(\d{1,9})$/;

// YYYY-MM-DD with a year from 1900 to 2999 (PostgreSQL refuses year 0000)
export const CALENDAR_DATE_PATTERN = /^(19|2\d)\d{2}-\d{2}-\d{2}$/;
