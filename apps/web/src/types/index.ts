// Types that match the API answers (see apps/api). Money is always integer cents.
export interface ApiEnvelope<T> {
  code: string;
  message: string;
  response: T;
  errors: string[];
}

export interface HealthReport {
  service: string;
  status: string;
  database: string;
}

export type UserRole = 'HQ_ADMIN' | 'OUTLET_MANAGER' | 'CASHIER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  // null for head office
  outlet: { id: string; code: string; name: string } | null;
}

export interface LoginResult {
  token: string;
  user: User;
}

// Business settings, for display only: the server uses its own when it prices a sale
export interface AppConfig {
  companyName: string;
  companyTaxNo: string;
  currency: string;
  vatBps: number;
  timezone: string;
}

export interface Outlet {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

// The code is set once, when the outlet is created
export interface OutletInput {
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  basePriceCents: number;
  isActive: boolean;
  createdAt: string;
}

export interface MenuItemInput {
  name: string;
  basePriceCents: number;
  isActive: boolean;
}

// One menu item assigned to one outlet
export interface Assignment {
  menuItemId: string;
  sku: string;
  name: string;
  basePriceCents: number;
  // null: the outlet follows the master price
  priceOverrideCents: number | null;
  // What the customer pays, worked out by the API
  effectivePriceCents: number;
  priceSource: 'BASE' | 'OUTLET';
  isAvailable: boolean;
  itemIsActive: boolean;
  stock: number;
}

export interface AssignmentInput {
  priceOverrideCents: number | null;
  isAvailable: boolean;
}

// One item an outlet can sell, as the till shows it
export interface OutletMenuItem {
  menuItemId: string;
  sku: string;
  name: string;
  effectivePriceCents: number;
  priceSource: 'BASE' | 'OUTLET';
  stock: number;
  outOfStock: boolean;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_BANKING';

export interface SaleRequest {
  orderType: OrderType;
  tableLabel: string | null;
  payment: { method: PaymentMethod; cashReceivedCents: number | null; reference: string | null };
  // The total shown to the customer; the API refuses the sale when its own differs
  expectedTotalCents: number;
  items: { menuItemId: string; quantity: number }[];
}

export interface SaleLine {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

// Sent with E_PRICE_CHANGED
export interface PriceChange {
  lines: SaleLine[];
  subtotalCents: number;
  vatBps: number;
  vatCents: number;
  totalCents: number;
}

// Sent with E_INSUFFICIENT_STOCK
export interface StockShortage {
  items: { menuItemId: string; name: string; requested: number; available: number }[];
}

// Sent with E_ITEM_NOT_SELLABLE
export interface UnsellableItems {
  items: { menuItemId: string; name: string | null }[];
}

export interface Receipt {
  id: string;
  receiptCode: string;
  receiptNumber: number;
  createdAt: string;
  orderType: OrderType;
  tableLabel: string | null;
  items: (SaleLine & { sku: string })[];
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
  // As it was when the sale was made
  header: {
    companyName: string;
    companyTaxNo: string;
    footer: string;
    currency: string;
    timezone: string;
    cashierName: string;
    outlet: { code: string; name: string; address: string | null; phone: string | null };
  };
}

export interface SaleSummary {
  id: string;
  receiptCode: string;
  createdAt: string;
  orderType: OrderType;
  tableLabel: string | null;
  paymentMethod: PaymentMethod;
  totalCents: number;
  itemCount: number;
  cashierName: string;
  outlet: { id: string; code: string; name: string };
}

export interface SaleQuery {
  offset: number;
  limit: number;
  // "DHK-000042" or "42"
  receipt?: string;
  // Business days as YYYY-MM-DD
  from?: string;
  to?: string;
}

export interface StockLine {
  menuItemId: string;
  sku: string;
  name: string;
  stock: number;
  lowStock: boolean;
  outOfStock: boolean;
  isSellable: boolean;
  updatedAt: string;
}

// What a person may choose; the others are written by the system
export type ManualStockReason = 'RESTOCK' | 'WASTE' | 'ADJUSTMENT';
export type StockReason = ManualStockReason | 'SALE' | 'VOID';

export interface StockChange {
  delta: number;
  reason: ManualStockReason;
  note: string | null;
}

export interface StockMovement {
  id: string;
  delta: number;
  quantityAfter: number;
  reason: StockReason;
  userName: string | null;
  note: string | null;
  receiptCode: string | null;
  createdAt: string;
}

export interface ListQuery {
  offset: number;
  limit: number;
  search?: string;
}

export interface Paged<T> {
  data: T[];
  offset: number;
  limit: number;
  total: number;
}
