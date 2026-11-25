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
