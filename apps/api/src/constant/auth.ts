export enum UserRole {
    HQ_ADMIN = "HQ_ADMIN",
    OUTLET_MANAGER = "OUTLET_MANAGER",
    CASHIER = "CASHIER",
}

export const USER_LIMITS = {
    EMAIL_MAX: 120,
    NAME_MAX: 100,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,
} as const;

// scrypt work factors: one of the OWASP recommended sets (32 MiB of memory, 3 passes)
export const SCRYPT = {
    COST: 32768,
    BLOCK_SIZE: 8,
    PARALLELISM: 3,
    KEY_BYTES: 64,
    SALT_BYTES: 16,
    MAX_MEMORY_BYTES: 64 * 1024 * 1024,
} as const;

export const GENERATED_PASSWORD_BYTES = 12;

export const AUTH_DEFAULTS = {
    TOKEN_LIFETIME: "8h",
    LOGIN_RATE_LIMIT_PER_MINUTE: 10,
} as const;

export const TOKEN_ALGORITHM = "HS256";
export const TOKEN_LIFETIME_PATTERN = /^[1-9]\d*[smhd]$/;
export const BEARER_PREFIX = "Bearer ";

export const JWT_SECRET_MIN_LENGTH = 32;
// The placeholder in .env.example, refused in production
export const EXAMPLE_JWT_SECRET = "change-me-to-a-random-secret-of-at-least-32-characters";

export enum UserCommand {
    CREATE = "create",
    SET_PASSWORD = "set-password",
    DEACTIVATE = "deactivate",
}
