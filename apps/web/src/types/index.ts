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

export interface Paged<T> {
  data: T[];
  offset: number;
  limit: number;
  total: number;
}
