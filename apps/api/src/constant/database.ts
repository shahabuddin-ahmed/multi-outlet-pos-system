// PostgreSQL error code for a transaction cancelled to break a deadlock
export const PG_DEADLOCK_CODE = "40P01";
export const DEADLOCK_ATTEMPTS = 3;

// PostgreSQL error code for a database that does not exist
export const PG_UNKNOWN_DATABASE_CODE = "3D000";
// PostgreSQL error codes for a wait or a query cut off by a time limit
export const PG_TIMEOUT_CODES = [
    // lock_timeout
    "55P03",
    // statement_timeout
    "57014",
];

// Milliseconds; 0 switches a limit off. A stuck query must not keep sales waiting for ever.
export const DATABASE_TIMEOUT_DEFAULTS = {
    STATEMENT_MS: 15_000,
    LOCK_MS: 10_000,
    IDLE_TRANSACTION_MS: 30_000,
} as const;

// How long a request waits for a free connection before it is told to try again
export const POOL_ACQUIRE_MS = 15_000;
