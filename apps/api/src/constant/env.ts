export enum NodeEnv {
    DEVELOPMENT = "development",
    TEST = "test",
    PRODUCTION = "production",
}

export const TEST_DATABASE_SUFFIX = "_test";

// Database names go into CREATE DATABASE, so only plain names are allowed
export const DATABASE_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

// The database PostgreSQL always has: used to create the app database when it is missing
export const ADMIN_DATABASE = "postgres";

export enum DbCommand {
    MIGRATE = "migrate",
    MIGRATE_DOWN = "migrate:down",
    MIGRATE_STATUS = "migrate:status",
    SEED = "seed",
    SEED_DOWN = "seed:down",
}
