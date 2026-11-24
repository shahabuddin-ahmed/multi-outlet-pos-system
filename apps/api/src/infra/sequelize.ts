import { QueryTypes, Sequelize } from "sequelize";
import config from "../config/config";
import { ADMIN_DATABASE } from "../constant/env";

export class ConnectDB {
    private static instance: Sequelize;

    public static initialize(): Sequelize {
        return new Sequelize(
            config.SEQUELIZE.POSTGRES_DB,
            config.SEQUELIZE.POSTGRES_USER,
            config.SEQUELIZE.POSTGRES_PASSWORD,
            config.SEQUELIZEOPTIONS
        );
    }

    public static getInstance(): Sequelize {
        if (!this.instance) {
            this.instance = ConnectDB.initialize();
        }
        return this.instance;
    }
}

// PostgreSQL has no CREATE DATABASE IF NOT EXISTS: connect to the admin database and check first.
export const createDatabaseIfMissing = async (): Promise<void> => {
    const { POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD } = config.SEQUELIZE;
    const server = new Sequelize(ADMIN_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD, {
        ...config.SEQUELIZEOPTIONS,
        pool: { max: 1, min: 0 },
    });
    try {
        const found = await server.query("SELECT 1 FROM pg_database WHERE datname = :name", {
            replacements: { name: POSTGRES_DB },
            type: QueryTypes.SELECT,
        });
        if (found.length === 0) {
            // The name is checked against DATABASE_NAME_PATTERN in config, so it is safe to quote here
            await server.query(`CREATE DATABASE "${POSTGRES_DB}"`);
        }
    } finally {
        await server.close();
    }
};

const newSequelize = (): Sequelize => {
    return ConnectDB.getInstance();
};

export default newSequelize;
