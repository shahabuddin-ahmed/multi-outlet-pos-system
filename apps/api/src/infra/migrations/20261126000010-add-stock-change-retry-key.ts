import { Migration } from "../migrator";

// A stock change carries a retry key, like a sale: the same request sent twice changes stock once.
// Movements written by sales have no key; a sale has its own.
export const up: Migration = async ({ context }) => {
    await context.sequelize.transaction(async (transaction) => {
        await context.sequelize.query("ALTER TABLE stock_movements ADD COLUMN idempotency_key UUID", { transaction });
        await context.sequelize.query(
            `CREATE UNIQUE INDEX uq_stock_movements_idempotency_key
             ON stock_movements (outlet_id, idempotency_key)
             WHERE idempotency_key IS NOT NULL`,
            { transaction }
        );
    });
};

export const down: Migration = async ({ context }) => {
    // Dropping the column drops its index too
    await context.sequelize.query("ALTER TABLE stock_movements DROP COLUMN idempotency_key");
};
