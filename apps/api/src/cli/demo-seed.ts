import config from "../config/config";
import initializeDBConnection from "../infra/db";
import newSequelize from "../infra/sequelize";
import { seedDemoData } from "./demo/seed-demo-data";

// Demo accounts have a public password, so this runs only when SEED_DEMO_DATA is true
const run = async (): Promise<void> => {
    try {
        // Returning from here still closes the connection pool, so the containers go on to start the API
        if (!config.SEED_DEMO_DATA) {
            console.log("No demo data: SEED_DEMO_DATA is not true.");
            return;
        }
        await initializeDBConnection();
        const added = await seedDemoData();
        console.log(
            added
                ? `Demo data added: ${added.outlets} outlets, ${added.items} items, ${added.users} users, ${added.sales} sales.`
                : "No demo data added: the database already has outlets."
        );
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        await newSequelize().close();
    }
};

run();
