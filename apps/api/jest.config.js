module.exports = {
    moduleFileExtensions: ["ts", "js"],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    },
    testMatch: ["**/src/**/*.test.(ts|js)"],
    testEnvironment: "node",
    setupFiles: ["<rootDir>/src/infra/test/silence-console.ts"],
    verbose: true,
};
