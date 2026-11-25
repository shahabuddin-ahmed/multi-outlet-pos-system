// Loaded before every test file, before the settings are read (.env never overrides these).
// Tests send many requests from one address, so the rate limits must not get in the way.
process.env.RATE_LIMIT_PER_MINUTE = "100000";
process.env.LOGIN_RATE_LIMIT_PER_MINUTE = "100000";
// A fixed secret, so tests do not depend on what is in .env
process.env.JWT_SECRET = "test-only-secret-0123456789-abcdefghij";
// Totals and report days in the tests assume these
process.env.VAT_BPS = "500";
process.env.BUSINESS_TIMEZONE = "Asia/Dhaka";
// The database tests read these back
process.env.DB_STATEMENT_TIMEOUT_MS = "15000";
process.env.DB_LOCK_TIMEOUT_MS = "10000";
