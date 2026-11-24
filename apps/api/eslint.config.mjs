// ESLint 9 "flat" config: finds mistakes only. Prettier (.prettierrc.json) decides how the code looks.
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
    {
        ignores: ["dist/**", "coverage/**", "node_modules/**", "**/*.d.ts", "src/types/**", "storage/**"],
    },
    js.configs.recommended,
    ...tsPlugin.configs["flat/recommended"],
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            globals: { ...globals.node, ...globals.jest },
        },
        rules: {
            // Unused on purpose: name it with a leading _ (e.g. Express's 4-argument error handler)
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
            ],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
    {
        // Plain JS config files (jest.config.js) use CommonJS
        files: ["**/*.js"],
        languageOptions: { sourceType: "commonjs", globals: globals.node },
    },
];
