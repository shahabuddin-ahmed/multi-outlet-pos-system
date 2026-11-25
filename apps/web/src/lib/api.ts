import { getToken } from '@/lib/token';
import type {
  ApiEnvelope,
  AppConfig,
  Assignment,
  AssignmentInput,
  HealthReport,
  ListQuery,
  LoginResult,
  MenuItem,
  MenuItemInput,
  Outlet,
  OutletInput,
  Paged,
  User
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const INVALID_DATA = 'E_INVALID_DATA';
const REQUEST_FAILED = 'REQUEST_FAILED';
const UNAUTHORIZED = 401;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly errors: string[],
    readonly status: number,
    // Data to react to, for example the new prices of a sale
    readonly details: unknown
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Could not reach the POS API.';
}

function apiErrorOf(status: number, payload: ApiEnvelope<unknown> | null): ApiError {
  // For a rejected form the first detail ("name is required") says more than the general message
  const detail = payload?.code === INVALID_DATA ? payload.errors?.[0] : undefined;
  const message = detail || payload?.message || payload?.errors?.[0] || 'Request failed';
  return new ApiError(
    message,
    payload?.code ?? REQUEST_FAILED,
    payload?.errors ?? [],
    status,
    payload?.response ?? null
  );
}

type SessionEndedHandler = (error: ApiError) => void;

let sessionEndedHandler: SessionEndedHandler | null = null;

// Called when the server no longer accepts the login in use (expired, switched off or password changed)
export function onSessionEnded(handler: SessionEndedHandler): () => void {
  sessionEndedHandler = handler;
  return () => {
    sessionEndedHandler = null;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const payload: ApiEnvelope<T> | null = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    const error = apiErrorOf(response.status, payload);
    // A late answer to a request of an earlier login must not end the current one
    if (response.status === UNAUTHORIZED && token && token === getToken()) {
      sessionEndedHandler?.(error);
    }
    throw error;
  }

  return payload.response;
}

// "?offset=0&limit=25", leaving out what is empty
function queryOf(values: object): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') {
      params.set(name, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

const send = <T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body: object) =>
  request<T>(path, { method, body: JSON.stringify(body) });

// Every API call lives here, so a page never builds a URL itself
export const api = {
  health: () => request<HealthReport>('/health'),
  appConfig: () => request<AppConfig>('/app-config'),

  login: (email: string, password: string) => send<LoginResult>('POST', '/auth/login', { email, password }),
  me: () => request<User>('/auth/me'),

  listOutlets: (query: ListQuery) => request<Paged<Outlet>>(`/outlets${queryOf(query)}`),
  createOutlet: (outlet: OutletInput & { code: string }) => send<Outlet>('POST', '/outlets', outlet),
  updateOutlet: (id: string, changes: Partial<OutletInput>) => send<Outlet>('PATCH', `/outlets/${id}`, changes),

  listMenuItems: (query: ListQuery) => request<Paged<MenuItem>>(`/menu-items${queryOf(query)}`),
  createMenuItem: (item: MenuItemInput & { sku: string }) => send<MenuItem>('POST', '/menu-items', item),
  updateMenuItem: (id: string, changes: Partial<MenuItemInput>) =>
    send<MenuItem>('PATCH', `/menu-items/${id}`, changes),

  listAssignments: (outletId: string, query: ListQuery) =>
    request<Paged<Assignment>>(`/outlets/${outletId}/assignments${queryOf(query)}`),
  // Assigns the item, or changes how the outlet sells it
  saveAssignment: (outletId: string, menuItemId: string, assignment: AssignmentInput) =>
    send<Assignment>('PUT', `/outlets/${outletId}/assignments/${menuItemId}`, assignment)
};
