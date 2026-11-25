import type { ApiEnvelope, HealthReport } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const NOT_FOUND = 'E_NOT_FOUND';
const INVALID_DATA = 'E_INVALID_DATA';
const REQUEST_FAILED = 'REQUEST_FAILED';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly errors: string[]
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Could not reach the POS API.';
}

function apiErrorOf(payload: ApiEnvelope<unknown> | null): ApiError {
  // For a rejected form the first detail ("title is required") says more than the general message
  const detail = payload?.code === INVALID_DATA ? payload.errors?.[0] : undefined;
  const message = detail || payload?.message || payload?.errors?.[0] || 'Request failed';
  return new ApiError(message, payload?.code ?? REQUEST_FAILED, payload?.errors ?? []);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const payload: ApiEnvelope<T> | null = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    throw apiErrorOf(payload);
  }

  return payload.response;
}

// Every API call lives here, so a page never builds a URL itself
export const api = {
  health: () => request<HealthReport>('/health')
};
