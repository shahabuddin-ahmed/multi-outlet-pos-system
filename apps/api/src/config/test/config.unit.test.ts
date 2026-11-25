// The .env file must not fill in what a test leaves out
jest.mock("dotenv/config", () => ({}));

const PRODUCTION = {
    NODE_ENV: "production",
    POSTGRES_PASSWORD: "a-database-password",
    JWT_SECRET: "a-real-secret-that-is-long-enough-0123456789",
};

const originalEnv = process.env;

afterEach(() => {
    process.env = originalEnv;
});

// Reads the settings again, from exactly these environment variables
const load = async (settings: Record<string, string>) => {
    process.env = { ...settings };
    let config!: typeof import("../config").default;
    await jest.isolateModulesAsync(async () => {
        config = (await import("../config")).default;
    });
    return config;
};

describe("settings", () => {
    it("has safe defaults", async () => {
        const config = await load(PRODUCTION);

        expect(config.SEED_DEMO_DATA).toBe(false);
        expect(config.APPLICATION_SERVER_PORT).toBe(4000);
        expect(config.SEQUELIZEOPTIONS.dialectOptions).toEqual({
            statement_timeout: 15000,
            lock_timeout: 10000,
            idle_in_transaction_session_timeout: 30000,
        });
    });

    it("takes the port from the hosting platform", async () => {
        expect((await load({ ...PRODUCTION, PORT: "8123" })).APPLICATION_SERVER_PORT).toBe(8123);
    });

    it("encrypts the database connection when asked, checking the certificate unless told not to", async () => {
        const checked = await load({ ...PRODUCTION, POSTGRES_SSL: "true" });
        const unchecked = await load({ ...PRODUCTION, POSTGRES_SSL: "true", POSTGRES_SSL_VERIFY: "false" });

        expect(checked.SEQUELIZEOPTIONS.dialectOptions).toMatchObject({ ssl: { rejectUnauthorized: true } });
        expect(unchecked.SEQUELIZEOPTIONS.dialectOptions).toMatchObject({ ssl: { rejectUnauthorized: false } });
    });

    it("sends no time limit that is set to 0", async () => {
        const config = await load({
            ...PRODUCTION,
            DB_STATEMENT_TIMEOUT_MS: "0",
            DB_LOCK_TIMEOUT_MS: "0",
            DB_IDLE_TRANSACTION_TIMEOUT_MS: "0",
        });

        expect(config.SEQUELIZEOPTIONS.dialectOptions).toEqual({});
    });

    it.each([
        ["no login secret", { JWT_SECRET: "" }, "JWT_SECRET"],
        ["a short login secret", { JWT_SECRET: "short" }, "JWT_SECRET"],
        ["the example login secret", { JWT_SECRET: "change-me-to-a-random-secret-of-at-least-32-characters" }, "JWT_"],
        ["an unknown time zone", { BUSINESS_TIMEZONE: "Asia/Nowhere" }, "BUSINESS_TIMEZONE"],
        ["an unsafe database name", { POSTGRES_DB: 'pos"; DROP' }, "POSTGRES_DB"],
        ["VAT above 100%", { VAT_BPS: "10001" }, "VAT_BPS"],
    ])("refuses to start with %s", async (_what, settings, named) => {
        await expect(load({ ...PRODUCTION, ...settings })).rejects.toThrow(named);
    });

    it("refuses to start in production without a database password", async () => {
        const { POSTGRES_PASSWORD: _leftOut, ...withoutPassword } = PRODUCTION;

        await expect(load(withoutPassword)).rejects.toThrow("POSTGRES_PASSWORD");
    });
});
