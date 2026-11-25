import { createDatabaseIfMissing, newMaintenanceSequelize } from "./sequelize";
import { newMigrator, newSeeder } from "./migrator";
import { DbCommand } from "../constant/env";

const run = async (command: DbCommand): Promise<void> => {
    const sequelize = newMaintenanceSequelize();
    const migrator = newMigrator(sequelize);
    const seeder = newSeeder(sequelize);

    try {
        switch (command) {
            case DbCommand.MIGRATE: {
                await createDatabaseIfMissing();
                const done = await migrator.up();
                console.log(done.length ? `Migrated: ${done.map((m) => m.name).join(", ")}` : "No new migrations.");
                break;
            }
            case DbCommand.MIGRATE_DOWN: {
                const undone = await migrator.down();
                console.log(undone.length ? `Undone: ${undone.map((m) => m.name).join(", ")}` : "Nothing to undo.");
                break;
            }
            case DbCommand.MIGRATE_STATUS: {
                const executed = await migrator.executed();
                const pending = await migrator.pending();
                console.log(`Done (${executed.length}): ${executed.map((m) => m.name).join(", ") || "-"}`);
                console.log(`Pending (${pending.length}): ${pending.map((m) => m.name).join(", ") || "-"}`);
                break;
            }
            case DbCommand.SEED: {
                const done = await seeder.up();
                console.log(done.length ? `Seeded: ${done.map((m) => m.name).join(", ")}` : "No new seeds.");
                break;
            }
            case DbCommand.SEED_DOWN: {
                const undone = await seeder.down({ to: 0 });
                console.log(
                    undone.length ? `Removed seeds: ${undone.map((m) => m.name).join(", ")}` : "No seeds to remove."
                );
                break;
            }
            default:
                throw new Error(`Unknown command "${command}". Use: ${Object.values(DbCommand).join(", ")}`);
        }
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run(process.argv[2] as DbCommand);
