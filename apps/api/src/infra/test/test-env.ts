// Loaded before every test file, before the settings are read (.env never overrides these).
// Tests send many requests from one address, so the rate limit must not get in the way.
process.env.RATE_LIMIT_PER_MINUTE = "100000";
