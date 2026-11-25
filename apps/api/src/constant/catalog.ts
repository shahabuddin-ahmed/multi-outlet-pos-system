// Limits for outlets and the menu. The database repeats the important ones as CHECK constraints.
export const OUTLET_LIMITS = {
    CODE_PATTERN: /^[A-Z0-9]{2,10}$/,
    CODE_MAX: 10,
    NAME_MAX: 100,
    ADDRESS_MAX: 200,
    PHONE_MAX: 30,
} as const;

export const MENU_ITEM_LIMITS = {
    SKU_PATTERN: /^[A-Za-z0-9-]{2,30}$/,
    SKU_MAX: 30,
    NAME_MAX: 100,
} as const;

// Money is whole minor units (paisa). 10,000,000 is 100,000.00
export const PRICE_MAX_CENTS = 10_000_000;

export enum PriceSource {
    // The outlet follows the master price
    BASE = "BASE",
    // The outlet has its own price
    OUTLET = "OUTLET",
}
