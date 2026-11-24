import "dotenv/config";
import Joi from "joi";
import { Options } from "sequelize";
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

interface Config extends AppConfig {
    SEQUELIZE: DatabaseConfig;
    SEQUELIZEOPTIONS: Options;
    SECURITY: SecurityConfig;
}

interface Env extends AppConfig, DatabaseConfig, SecurityConfig {}

const databaseName = Joi.string().pattern(DATABASE_NAME_PATTERN).max(63);

const envSchema = Joi.object<Env>({
    NODE_ENV: Joi.string()
        .valid(...Object.values(NodeEnv))
        .default(NodeEnv.DEVELOPMENT),
    APPLICATION_SERVER_PORT: Joi.number().port().default(4000),
    APP_FORCE_SHUTDOWN_SECOND: Joi.number().integer().min(1).default(30),

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
}).unknown(true);

const { value: env, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
    throw new Error(`Invalid environment settings: ${error.details.map((detail) => detail.message).join("; ")}`);
}

const config: Config = {
    NODE_ENV: env.NODE_ENV,
    APPLICATION_SERVER_PORT: env.APPLICATION_SERVER_PORT,
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
};

export default config;
