export const SERVICE_NAME = "pos-api";

export enum DatabaseStatus {
    UP = "up",
    DOWN = "down",
}

export enum ServiceStatus {
    OK = "ok",
    DEGRADED = "degraded",
}

export enum HealthMessages {
    HEALTHY = "POS API is healthy",
    DEGRADED = "POS API is running, but the database is unreachable",
    DATABASE_CONNECTION_FAILED = "Database connection failed",
}

export interface HealthReport {
    service: typeof SERVICE_NAME;
    status: ServiceStatus;
    database: DatabaseStatus;
}
