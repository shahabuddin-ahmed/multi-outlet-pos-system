import { QueryTypes, Transaction } from "sequelize";
import newSequelize from "../infra/sequelize";
import { ListQuery, Rows } from "../service/page";
import { containsPattern } from "../utils/utility";

// One line of an outlet's menu. It is read through joins, so this repository uses plain SQL.
export interface AssignmentRecord {
    // The menu item's public id
    menuItemId: string;
    sku: string;
    name: string;
    basePriceCents: number;
    priceOverrideCents: number | null;
    isAvailable: boolean;
    itemIsActive: boolean;
    quantity: number;
}

// Internal integer ids
export interface AssignmentKey {
    outletId: number;
    menuItemId: number;
}

export interface AssignmentInput {
    priceOverrideCents: number | null;
    isAvailable: boolean;
}

export interface AssignmentRepoInterface {
    insertIfMissing(key: AssignmentKey, input: AssignmentInput, transaction: Transaction): Promise<boolean>;
    update(key: AssignmentKey, input: AssignmentInput, transaction: Transaction): Promise<void>;
    ensureStockRow(key: AssignmentKey, transaction: Transaction): Promise<void>;
    findOne(key: AssignmentKey, transaction: Transaction): Promise<AssignmentRecord | null>;
    listByOutlet(outletId: number, query: ListQuery): Promise<Rows<AssignmentRecord>>;
    listSellable(outletId: number, query: ListQuery): Promise<Rows<AssignmentRecord>>;
}

const SELECT_COLUMNS = `
    m.public_id AS "menuItemId",
    m.sku AS "sku",
    m.name AS "name",
    m.base_price_cents AS "basePriceCents",
    a.price_override_cents AS "priceOverrideCents",
    a.is_available AS "isAvailable",
    m.is_active AS "itemIsActive",
    i.quantity AS "quantity"`;

const FROM_JOINS = `
    FROM outlet_menu_items a
    JOIN menu_items m ON m.id = a.menu_item_id
    JOIN inventory i ON i.outlet_id = a.outlet_id AND i.menu_item_id = a.menu_item_id`;

const OF_OUTLET = "a.outlet_id = :outletId";
// Switched on at this outlet and active at head office
const SELLABLE = ["a.is_available", "m.is_active"];
const MATCHES_SEARCH = "(m.name ILIKE :pattern OR m.sku ILIKE :pattern)";

export class AssignmentRepo implements AssignmentRepoInterface {
    // True when this call created the row. A second request for the same pair waits here until the first
    // one commits, then inserts nothing.
    public async insertIfMissing(
        key: AssignmentKey,
        input: AssignmentInput,
        transaction: Transaction
    ): Promise<boolean> {
        const inserted = await newSequelize().query(
            `INSERT INTO outlet_menu_items (outlet_id, menu_item_id, price_override_cents, is_available)
             VALUES (:outletId, :menuItemId, :priceOverrideCents, :isAvailable)
             ON CONFLICT (outlet_id, menu_item_id) DO NOTHING
             RETURNING id`,
            { replacements: { ...key, ...input }, type: QueryTypes.SELECT, transaction }
        );
        return inserted.length > 0;
    }

    public async update(key: AssignmentKey, input: AssignmentInput, transaction: Transaction): Promise<void> {
        await newSequelize().query(
            `UPDATE outlet_menu_items
             SET price_override_cents = :priceOverrideCents, is_available = :isAvailable, updated_at = now()
             WHERE outlet_id = :outletId AND menu_item_id = :menuItemId`,
            { replacements: { ...key, ...input }, transaction }
        );
    }

    // A new assignment starts with stock 0; an existing stock row is left alone
    public async ensureStockRow(key: AssignmentKey, transaction: Transaction): Promise<void> {
        await newSequelize().query(
            `INSERT INTO inventory (outlet_id, menu_item_id) VALUES (:outletId, :menuItemId)
             ON CONFLICT (outlet_id, menu_item_id) DO NOTHING`,
            { replacements: { ...key }, transaction }
        );
    }

    public async findOne(key: AssignmentKey, transaction: Transaction): Promise<AssignmentRecord | null> {
        const rows = await newSequelize().query<AssignmentRecord>(
            `SELECT ${SELECT_COLUMNS} ${FROM_JOINS}
             WHERE ${OF_OUTLET} AND a.menu_item_id = :menuItemId`,
            { replacements: { ...key }, type: QueryTypes.SELECT, transaction }
        );
        return rows[0] ?? null;
    }

    public async listByOutlet(outletId: number, query: ListQuery): Promise<Rows<AssignmentRecord>> {
        return this.listWhere([OF_OUTLET], outletId, query);
    }

    public async listSellable(outletId: number, query: ListQuery): Promise<Rows<AssignmentRecord>> {
        return this.listWhere([OF_OUTLET, ...SELLABLE], outletId, query);
    }

    // The conditions are fixed text from this file; what the user typed only goes through replacements
    private async listWhere(
        conditions: string[],
        outletId: number,
        { search, offset, limit }: ListQuery
    ): Promise<Rows<AssignmentRecord>> {
        const where = (search ? [...conditions, MATCHES_SEARCH] : conditions).join(" AND ");
        const replacements = { outletId, offset, limit, pattern: search ? containsPattern(search) : null };

        const [rows, counted] = await Promise.all([
            newSequelize().query<AssignmentRecord>(
                `SELECT ${SELECT_COLUMNS} ${FROM_JOINS}
                 WHERE ${where}
                 ORDER BY m.name, m.id
                 LIMIT :limit OFFSET :offset`,
                { replacements, type: QueryTypes.SELECT }
            ),
            newSequelize().query<{ total: number }>(
                `SELECT CAST(COUNT(*) AS INTEGER) AS total ${FROM_JOINS} WHERE ${where}`,
                { replacements, type: QueryTypes.SELECT }
            ),
        ]);

        return { rows, total: counted[0].total };
    }
}

export const newAssignmentRepo = async (): Promise<AssignmentRepoInterface> => {
    return new AssignmentRepo();
};
