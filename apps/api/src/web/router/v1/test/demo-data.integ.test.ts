import { Express } from "express";
import { QueryTypes } from "sequelize";
import { DEMO_ADMIN, DEMO_PASSWORD } from "../../../../cli/demo/demo-data";
import { seedDemoData } from "../../../../cli/demo/seed-demo-data";
import newSequelize from "../../../../infra/sequelize";
import { resetTestData } from "../../../../infra/test/test-database";
import { startTestApp } from "./test-app";
import { logIn } from "./test-auth";

let app: Express;

beforeAll(async () => {
    app = await startTestApp();
    await resetTestData();
});

afterAll(async () => {
    await newSequelize().close();
});

const numberOf = async (sql: string): Promise<number> => {
    const rows = await newSequelize().query<{ total: number }>(`SELECT CAST(COUNT(*) AS INTEGER) AS total ${sql}`, {
        type: QueryTypes.SELECT,
    });
    return rows[0].total;
};

// Each of these counts rows that should not exist
const BROKEN = {
    "a sale whose lines do not add up": `FROM sales s WHERE s.subtotal_cents <>
        (SELECT SUM(line_total_cents) FROM sale_items i WHERE i.sale_id = s.id)`,
    "a receipt counter that does not match the sales": `FROM outlet_receipt_counters c
        LEFT JOIN (SELECT outlet_id, COUNT(*) AS made, MAX(receipt_no) AS highest FROM sales GROUP BY outlet_id) s
            ON s.outlet_id = c.outlet_id
        WHERE c.last_number <> COALESCE(s.made, 0) OR c.last_number <> COALESCE(s.highest, 0)`,
    "stock that differs from its last history row": `FROM inventory i WHERE i.quantity <>
        (SELECT quantity_after FROM stock_movements m
         WHERE m.outlet_id = i.outlet_id AND m.menu_item_id = i.menu_item_id ORDER BY m.id DESC LIMIT 1)`,
    "a sale line without its stock movement": `FROM sale_items i WHERE NOT EXISTS
        (SELECT 1 FROM stock_movements m
         WHERE m.sale_id = i.sale_id AND m.menu_item_id = i.menu_item_id AND m.delta = -i.quantity)`,
    "a receipt older than the one before it, or in the future": `FROM
        (SELECT created_at, LAG(created_at) OVER (PARTITION BY outlet_id ORDER BY receipt_no) AS earlier FROM sales) t
        WHERE t.earlier > t.created_at OR t.created_at > now()`,
    "history that goes back in time": `FROM
        (SELECT created_at, LAG(created_at) OVER (PARTITION BY outlet_id, menu_item_id ORDER BY id) AS earlier
         FROM stock_movements) t
        WHERE t.earlier > t.created_at`,
};

describe("demo data", () => {
    it("fills an empty database with consistent data, once", async () => {
        const added = await seedDemoData();
        const sales = await numberOf("FROM sales");
        const again = await seedDemoData();

        expect(added).toMatchObject({ outlets: 3, items: 10, users: 7, sales });
        expect(sales).toBeGreaterThanOrEqual(14 * 3 * 5);
        expect(again).toBeNull();
        expect(await numberOf("FROM sales")).toBe(sales);
        expect(await numberOf("FROM users")).toBe(7);
        for (const [problem, sql] of Object.entries(BROKEN)) {
            expect([problem, await numberOf(sql)]).toEqual([problem, 0]);
        }
        // One item switched off at one outlet, one running low and one sold out
        expect(await numberOf("FROM outlet_menu_items WHERE NOT is_available")).toBe(1);
        expect(await numberOf("FROM inventory WHERE quantity = 3")).toBe(1);
        expect(await numberOf("FROM inventory WHERE quantity = 0")).toBe(1);
        expect((await logIn(app, DEMO_ADMIN.email, DEMO_PASSWORD)).status).toBe(200);
    });
});
