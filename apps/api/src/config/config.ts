import "dotenv/config";
import Joi from "joi";
import { Options } from "sequelize";
import { DEFAULT_PORT } from "../constant/api";
import { AUTH_DEFAULTS, EXAMPLE_JWT_SECRET, JWT_SECRET_MIN_LENGTH, TOKEN_LIFETIME_PATTERN } from "../constant/auth";
import { BUSINESS_DEFAULTS, CURRENCY_PATTERN, VAT_BPS_MAX } from "../constant/business";
import { DATABASE_NAME_PATTERN, NodeEnv, TEST_DATABASE_SUFFIX } from "../constant/env";

interface AppConfig {
    NODE_ENV: NodeEnv;
    APPLICATION_SERVER_PORT: number;
    APP_FORCE_SHUTDOWN_SECOND: number;
}

interface DatabaseConfig {
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_DB: string;
    POSTGRES_TEST_DB: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
}

interface SecurityConfig {
    WEB_ORIGIN: string[];
    RATE_LIMIT_PER_MINUTE: number;
    // How many proxies (load balancers) sit in front of the API; 0 when none
    TRUST_PROXY: number;
}

export interface BusinessConfig {
    BUSINESS_TIMEZONE: string;
    CURRENCY: string;
    VAT_BPS: number;
    COMPANY_NAME: string;
    COMPANY_TAX_NO: string;
    RECEIPT_FOOTER: string;
}

export interface AuthConfig {
    JWT_SECRET: string;
    // How long a login lasts, e.g. "8h"
    JWT_EXPIRES_IN: string;
    LOGIN_RATE_LIMIT_PER_MINUTE: number;
}

interface Config extends AppConfig {
    SEQUELIZE: DatabaseConfig;
    SEQUELIZEOPTIONS: Options;
    SECURITY: SecurityConfig;
    AUTH: AuthConfig;
    BUSINESS: BusinessConfig;
    // Adds made-up data, with a public password, to an empty database
    SEED_DEMO_DATA: boolean;
}

interface Env extends AppConfig, DatabaseConfig, SecurityConfig, AuthConfig, BusinessConfig {
    // Hosting platforms set PORT; APPLICATION_SERVER_PORT wins when both are set
    PORT?: number;
    SEED_DEMO_DATA: boolean;
}

const databaseName = Joi.string().pattern(DATABASE_NAME_PATTERN).max(63);

const timeZone = Joi.string().custom((value: string, helpers) => {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return value;
    } catch {
        return helpers.error("any.invalid");
    }
});

const envSchema = Joi.object<Env>({
    NODE_ENV: Joi.string()
        .valid(...Object.values(NodeEnv))
        .default(NodeEnv.DEVELOPMENT),
    APPLICATION_SERVER_PORT: Joi.number().port(),
    PORT: Joi.number().port(),
    APP_FORCE_SHUTDOWN_SECOND: Joi.number().integer().min(1).default(30),
    // Off unless asked for, so a real installation never gets known passwords
    SEED_DEMO_DATA: Joi.boolean().default(false),

    POSTGRES_HOST: Joi.string().default("127.0.0.1"),
    POSTGRES_PORT: Joi.number().port().default(5432),
    POSTGRES_DB: databaseName.default("pos"),
    POSTGRES_TEST_DB: databaseName.default(
        Joi.ref("POSTGRES_DB", { adjust: (name: string) => `${name}${TEST_DATABASE_SUFFIX}` })
    ),
    POSTGRES_USER: Joi.string().default("postgres"),
    POSTGRES_PASSWORD: Joi.string()
        .allow("")
        .when("NODE_ENV", {
            is: NodeEnv.PRODUCTION,
            then: Joi.required(),
            otherwise: Joi.string().default("postgres"),
        }),

    WEB_ORIGIN: Joi.string()
        .custom((value: string) =>
            value
                .split(",")
                .map((origin) => origin.trim())
                .filter(Boolean)
        )
        .default(["http://localhost:5173", "http://localhost:3000"]),
    RATE_LIMIT_PER_MINUTE: Joi.number().integer().min(1).max(100000).default(600),
    TRUST_PROXY: Joi.number().integer().min(0).default(0),

    // No default on purpose: a built-in secret would let anyone create a login token
    JWT_SECRET: Joi.string()
        .min(JWT_SECRET_MIN_LENGTH)
        .required()
        .when("NODE_ENV", { is: NodeEnv.PRODUCTION, then: Joi.string().invalid(EXAMPLE_JWT_SECRET) }),
    JWT_EXPIRES_IN: Joi.string().pattern(TOKEN_LIFETIME_PATTERN).default(AUTH_DEFAULTS.TOKEN_LIFETIME),
    LOGIN_RATE_LIMIT_PER_MINUTE: Joi.number()
        .integer()
        .min(1)
        .max(100000)
        .default(AUTH_DEFAULTS.LOGIN_RATE_LIMIT_PER_MINUTE),

    BUSINESS_TIMEZONE: timeZone.default(BUSINESS_DEFAULTS.TIMEZONE),
    CURRENCY: Joi.string().pattern(CURRENCY_PATTERN).default(BUSINESS_DEFAULTS.CURRENCY),
    VAT_BPS: Joi.number().integer().min(0).max(VAT_BPS_MAX).default(BUSINESS_DEFAULTS.VAT_BPS),
    COMPANY_NAME: Joi.string().max(100).default(BUSINESS_DEFAULTS.COMPANY_NAME),
    COMPANY_TAX_NO: Joi.string().max(60).allow("").default(BUSINESS_DEFAULTS.COMPANY_TAX_NO),
    RECEIPT_FOOTER: Joi.string().max(200).allow("").default(BUSINESS_DEFAULTS.RECEIPT_FOOTER),
}).unknown(true);

const { value: env, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
    throw new Error(`Invalid environment settings: ${error.details.map((detail) => detail.message).join("; ")}`);
}

const config: Config = {
    NODE_ENV: env.NODE_ENV,
    APPLICATION_SERVER_PORT: env.APPLICATION_SERVER_PORT ?? env.PORT ?? DEFAULT_PORT,
    APP_FORCE_SHUTDOWN_SECOND: env.APP_FORCE_SHUTDOWN_SECOND,
    SEQUELIZE: {
        POSTGRES_HOST: env.POSTGRES_HOST,
        POSTGRES_PORT: env.POSTGRES_PORT,
        // Tests always run on the _test database, so they never touch real data
        POSTGRES_DB: env.NODE_ENV === NodeEnv.TEST ? env.POSTGRES_TEST_DB : env.POSTGRES_DB,
        POSTGRES_TEST_DB: env.POSTGRES_TEST_DB,
        POSTGRES_USER: env.POSTGRES_USER,
        POSTGRES_PASSWORD: env.POSTGRES_PASSWORD,
    },
    SEQUELIZEOPTIONS: {
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        dialect: "postgres",
        pool: { max: 20, min: 2, idle: 10000 },
        define: { timestamps: false },
        logging: false,
    },
    SECURITY: {
        WEB_ORIGIN: env.WEB_ORIGIN,
        RATE_LIMIT_PER_MINUTE: env.RATE_LIMIT_PER_MINUTE,
        TRUST_PROXY: env.TRUST_PROXY,
    },
    AUTH: {
        JWT_SECRET: env.JWT_SECRET,
        JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
        LOGIN_RATE_LIMIT_PER_MINUTE: env.LOGIN_RATE_LIMIT_PER_MINUTE,
    },
    BUSINESS: {
        BUSINESS_TIMEZONE: env.BUSINESS_TIMEZONE,
        CURRENCY: env.CURRENCY,
        VAT_BPS: env.VAT_BPS,
        COMPANY_NAME: env.COMPANY_NAME,
        COMPANY_TAX_NO: env.COMPANY_TAX_NO,
        RECEIPT_FOOTER: env.RECEIPT_FOOTER,
    },
    SEED_DEMO_DATA: env.SEED_DEMO_DATA,
};

export default config;
