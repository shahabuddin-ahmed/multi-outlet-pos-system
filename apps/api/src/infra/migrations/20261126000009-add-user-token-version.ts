import { Migration } from "../migrator";

// A login token carries the version it was made with. Changing a password raises the version,
// so every earlier token stops working.
export const up: Migration = async ({ context }) => {
    await context.sequelize.query("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0");
};

export const down: Migration = async ({ context }) => {
    await context.sequelize.query("ALTER TABLE users DROP COLUMN token_version");
};
