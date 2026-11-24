import config from "../../config/config";
import { TEST_DATABASE_SUFFIX } from "../../constant/env";
import newSequelize, { createDatabaseIfMissing } from "../sequelize";
import { newMigrator, newSeeder } from "../migrator";

// Helpers for integration tests. They only ever touch a database whose name ends with TEST_DATABASE_SUFFIX.
export const assertTestDatabase = (): void => {
    const name = config.SEQUELIZE.POSTGRES_DB;
    if (!name.endsWith(TEST_DATABASE_SUFFIX)) {
        throw new Error(
            `Refusing to change "${name}" in a test (the database name must end with ${TEST_DATABASE_SUFFIX})`
        );
    }
};

// Creates the test database when missing and brings it up to date (tables and default data).
export const prepareTestDatabase = async (): Promise<void> => {
    assertTestDatabase();
    await createDatabaseIfMissing();
    const sequelize = newSequelize();
    await newMigrator(sequelize).up();
    await newSeeder(sequelize).up();
};
