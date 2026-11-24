export const API_PREFIX = "/api/v1";

export const JSON_BODY_LIMIT = "100kb";

export const PAGINATION = {
    DEFAULT_LIST_LIMIT: 25,
    MAX_LIST_LIMIT: 100,
} as const;

export const MS_PER_SECOND = 1000;

export const NS_PER_MS = 1_000_000;

export const RATE_LIMIT_WINDOW_MS = 60 * MS_PER_SECOND;

export const CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
export const CORS_MAX_AGE_SECONDS = 600;

export const REQUEST_ID_HEADER = "X-Request-Id";
export const SAFE_REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;
