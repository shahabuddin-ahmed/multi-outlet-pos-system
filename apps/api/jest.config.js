module.exports = {
    moduleFileExtensions: ["ts", "js"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    },
    testMatch: ["**/src/**/*.test.(ts|js)"],
    testEnvironment: "node",
    // The first run compiles the app and prepares the database; the concurrency tests send many requests
    testTimeout: 30_000,
    setupFiles: ["<rootDir>/src/infra/test/silence-console.ts", "<rootDir>/src/infra/test/test-env.ts"],
    verbose: true,
};
