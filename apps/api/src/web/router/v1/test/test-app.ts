import { Express } from "express";
import { prepareTestDatabase } from "../../../../infra/test/test-database";

// The app checks for pending migrations as soon as it is loaded, so the test database is prepared first
export const startTestApp = async (): Promise<Express> => {
    await prepareTestDatabase();
    const { default: app, appReady } = await import("../../../../app");
    await appReady;
    return app;
};
