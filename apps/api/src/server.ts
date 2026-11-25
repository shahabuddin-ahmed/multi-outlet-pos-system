import http from "http";
import app, { appReady } from "./app";
import config from "./config/config";
import { MS_PER_SECOND } from "./constant/api";
import logger from "./infra/logger";
import newSequelize from "./infra/sequelize";

const server = http.createServer(app);

const closeDatabase = async (): Promise<void> => {
    try {
        await newSequelize().close();
        logger.info("Database connection closed");
    } catch {
        logger.error("Could not close the database connection");
    }
};

const shutdown = (): void => {
    logger.info("Shutting down gracefully");
    server.close(async () => {
        await closeDatabase();
        process.exit();
    });

    setTimeout(() => {
        logger.error("Could not close connections in time, forcing shutdown");
        process.exit(1);
    }, config.APP_FORCE_SHUTDOWN_SECOND * MS_PER_SECOND);
};

const start = async (): Promise<void> => {
    try {
        await appReady;
        server.listen(config.APPLICATION_SERVER_PORT, () => {
            logger.info("POS API is running", { port: config.APPLICATION_SERVER_PORT });
        });
    } catch (err) {
        logger.error("POS API could not start", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
