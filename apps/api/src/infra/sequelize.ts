import { QueryTypes, Sequelize } from "sequelize";
import config from "../config/config";
import { PG_UNKNOWN_DATABASE_CODE } from "../constant/database";
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

// A single connection for setup work. It keeps the encryption setting but not the time limits:
// a migration may rightly take long, for example to index a big table.
export const newMaintenanceSequelize = (database: string = config.SEQUELIZE.POSTGRES_DB): Sequelize => {
    const { ssl } = config.SEQUELIZEOPTIONS.dialectOptions as { ssl?: object };
    return new Sequelize(database, config.SEQUELIZE.POSTGRES_USER, config.SEQUELIZE.POSTGRES_PASSWORD, {
        ...config.SEQUELIZEOPTIONS,
        dialectOptions: ssl ? { ssl } : {},
        pool: { max: 1, min: 0 },
    });
};

const databaseExists = async (database: string): Promise<boolean> => {
    const connection = newMaintenanceSequelize(database);
    try {
        await connection.authenticate();
        return true;
    } catch (err: any) {
        if (err?.parent?.code === PG_UNKNOWN_DATABASE_CODE) {
            return false;
        }
        throw err;
    } finally {
        await connection.close();
    }
};

// The app database is tried first, so a hosted database that offers nothing else works. Only when it is
// missing is the admin database used: PostgreSQL has no CREATE DATABASE IF NOT EXISTS.
export const createDatabaseIfMissing = async (database: string = config.SEQUELIZE.POSTGRES_DB): Promise<void> => {
    if (await databaseExists(database)) {
        return;
    }
    const server = newMaintenanceSequelize(ADMIN_DATABASE);
    try {
        const found = await server.query("SELECT 1 FROM pg_database WHERE datname = :name", {
            replacements: { name: database },
            type: QueryTypes.SELECT,
        });
        if (found.length === 0) {
            // The name comes from settings checked against DATABASE_NAME_PATTERN, so it is safe to quote here
            await server.query(`CREATE DATABASE "${database}"`);
        }
    } finally {
        await server.close();
    }
};

const newSequelize = (): Sequelize => {
    return ConnectDB.getInstance();
};

export default newSequelize;
