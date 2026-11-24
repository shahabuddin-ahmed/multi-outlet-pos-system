import { Sequelize } from "sequelize";
import newSequelize from "./sequelize";
import { newMigrator } from "./migrator";
import logger from "./logger";

export const initializeDBConnection = async (): Promise<Sequelize> => {
    const sequelize = newSequelize();
    try {
        await sequelize.authenticate();
        logger.info("Connected to the database server");
    } catch (err) {
        logger.error("Could not connect to the database server", {
            error: err instanceof Error ? err.message : String(err),
        });
        process.exit(1);
    }

    const pending = await newMigrator(sequelize).pending();
    if (pending.length > 0) {
        logger.error(
            "The database has pending migrations. Run `yarn db:migrate` (and `yarn db:seed` on a new database)",
            {
                pending: pending.map((migration) => migration.name).join(", "),
            }
        );
        process.exit(1);
    }

    return sequelize;
};

export default initializeDBConnection;
