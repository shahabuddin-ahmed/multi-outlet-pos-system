import { Migration } from "../migrator";

const replaceIndex = (columns: string) => [
    "DROP INDEX idx_sales_outlet_created",
    `CREATE INDEX idx_sales_outlet_created ON sales (outlet_id, created_at DESC, id DESC) INCLUDE (${columns})`,
];

const run = async ({ context: queryInterface }: Parameters<Migration>[0], statements: string[]): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
        for (const statement of statements) {
            await queryInterface.sequelize.query(statement, { transaction });
        }
    });
};

// The revenue report sums all three amounts, so the index holds them and the table need not be read
export const up: Migration = (params) => run(params, replaceIndex("subtotal_cents, vat_cents, total_cents"));

export const down: Migration = (params) => run(params, replaceIndex("total_cents"));
