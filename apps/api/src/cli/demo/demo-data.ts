import { UserRole } from "../../constant/auth";

// Made-up data for trying the system out. Prices are in paisa (22000 = 220.00).

// Public on purpose: it is only ever used when SEED_DEMO_DATA is true
export const DEMO_PASSWORD = "demo-pos-2026";

export const DEMO_OUTLETS = [
    { code: "DHK", name: "Dhanmondi", address: "Road 27, Dhanmondi, Dhaka", phone: "01700-000001" },
    { code: "GUL", name: "Gulshan", address: "Gulshan Avenue, Gulshan 2, Dhaka", phone: "01700-000002" },
    { code: "UTT", name: "Uttara", address: "Sector 7, Uttara, Dhaka", phone: "01700-000003" },
];

export const DEMO_ITEMS = [
    { sku: "BG-001", name: "Chicken Burger", basePriceCents: 22000 },
    { sku: "BG-002", name: "Beef Burger", basePriceCents: 28000 },
    { sku: "RC-001", name: "Chicken Biryani", basePriceCents: 25000 },
    { sku: "RC-002", name: "Beef Tehari", basePriceCents: 22000 },
    { sku: "SD-001", name: "French Fries", basePriceCents: 12000 },
    { sku: "SD-002", name: "Chicken Wings (6 pcs)", basePriceCents: 30000 },
    { sku: "PZ-001", name: "Margherita Pizza", basePriceCents: 55000 },
    { sku: "DR-001", name: "Cold Coffee", basePriceCents: 18000 },
    { sku: "DR-002", name: "Lemon Mint", basePriceCents: 12000 },
    { sku: "DR-003", name: "Mineral Water", basePriceCents: 2000 },
];

// Outlet prices that differ from the master price
export const DEMO_OUTLET_PRICES: Record<string, Record<string, number>> = {
    GUL: { "BG-002": 32000, "DR-001": 22000 },
    UTT: { "DR-003": 1500 },
};

// Assigned but switched off at that outlet
export const DEMO_OFF = { outletCode: "UTT", sku: "PZ-001" };

// Stock left after the demo sales, so the low stock list has something to show
export const DEMO_FINAL_STOCK = [
    { outletCode: "DHK", sku: "SD-001", quantity: 3 },
    { outletCode: "GUL", sku: "DR-002", quantity: 0 },
];

export const DEMO_ADMIN = { email: "hq@demo.test", fullName: "HQ Admin", role: UserRole.HQ_ADMIN };

export const demoStaffOf = ({ code, name }: { code: string; name: string }) => ({
    manager: {
        email: `manager.${code.toLowerCase()}@demo.test`,
        fullName: `${name} Manager`,
        role: UserRole.OUTLET_MANAGER,
        outletCode: code,
    },
    cashier: {
        email: `cashier.${code.toLowerCase()}@demo.test`,
        fullName: `${name} Cashier`,
        role: UserRole.CASHIER,
        outletCode: code,
    },
});

export const DEMO_HISTORY = {
    DAYS: 14,
    OPENING_STOCK: 500,
    SALES_PER_DAY: { MIN: 5, MAX: 10 },
    // Local opening hours
    OPENS_AT_HOUR: 10,
    CLOSES_AT_HOUR: 22,
    RESTOCK_AT_HOUR: 8,
    TABLES: 8,
    // The same seed gives the same mix of sales every time
    RANDOM_SEED: 2026,
};
