import express from "express";
import { QueryTypes, Sequelize } from "sequelize";
import request from "supertest";
import config from "../../config/config";
import { ADMIN_DATABASE } from "../../constant/env";
import { globalErrorHandler } from "../../web/middleware/global-error-handler";
import newSequelize, { createDatabaseIfMissing, newMaintenanceSequelize } from "../sequelize";
import { prepareTestDatabase } from "./test-database";

beforeAll(async () => {
    await prepareTestDatabase();
});

afterAll(async () => {
    await newSequelize().close();
});

const settingOf = async (connection: Sequelize, name: "statement_timeout" | "lock_timeout"): Promise<string> => {
    const rows = await connection.query<Record<string, string>>(`SHOW ${name}`, { type: QueryTypes.SELECT });
    return rows[0][name];
};

// How the API would answer a request that failed with this error
const answerFor = (error: unknown) => {
    const app = express();
    app.get("/", (_req, _res, next) => next(error));
    app.use(globalErrorHandler);
    return request(app).get("/");
};

describe("the database connection", () => {
    it("limits how long the API waits, but not how long setup work may take", async () => {
        const maintenance = newMaintenanceSequelize();

        expect(await settingOf(newSequelize(), "statement_timeout")).toBe("15s");
        expect(await settingOf(newSequelize(), "lock_timeout")).toBe("10s");
        expect(await settingOf(maintenance, "statement_timeout")).toBe("0");
        await maintenance.close();
    });

    it("answers 503, try again, when a wait for a locked row is cut off", async () => {
        const sequelize = newSequelize();
        await sequelize.query("CREATE TABLE IF NOT EXISTS lock_probe (id INTEGER)");
        await sequelize.query("INSERT INTO lock_probe VALUES (1)");
        const holder = await sequelize.transaction();
        const waiter = await sequelize.transaction();
        try {
            await sequelize.query("SELECT id FROM lock_probe FOR UPDATE", { transaction: holder });
            await sequelize.query("SET LOCAL lock_timeout = 100", { transaction: waiter });

            const error = await sequelize
                .query("SELECT id FROM lock_probe FOR UPDATE", { transaction: waiter })
                .then(() => null)
                .catch((err) => err);
            const res = await answerFor(error);

            expect(res.status).toBe(503);
            expect(res.body.code).toBe("E_SERVICE_UNAVAILABLE");
        } finally {
            await waiter.rollback();
            await holder.rollback();
            await sequelize.query("DROP TABLE lock_probe");
        }
    });

    it("creates a missing database once and leaves an existing one alone", async () => {
        // Ends with _test like every database the tests touch
        const name = `${config.SEQUELIZE.POSTGRES_DB.replace(/_test$/, "")}_setup_test`;
        const server = newMaintenanceSequelize(ADMIN_DATABASE);
        const count = async () =>
            (
                await server.query("SELECT 1 FROM pg_database WHERE datname = :name", {
                    replacements: { name },
                    type: QueryTypes.SELECT,
                })
            ).length;
        try {
            await server.query(`DROP DATABASE IF EXISTS "${name}"`);

            await createDatabaseIfMissing(name);
            await createDatabaseIfMissing(name);

            expect(await count()).toBe(1);
        } finally {
            await server.query(`DROP DATABASE IF EXISTS "${name}"`);
            await server.close();
        }
    });
});
