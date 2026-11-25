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

export interface Paged<T> {
  data: T[];
  offset: number;
  limit: number;
  total: number;
}
