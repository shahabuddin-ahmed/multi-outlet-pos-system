import { QueryTypes, Transaction } from "sequelize";
import { STOCK_MAX, StockReason } from "../constant/stock";
import newSequelize from "../infra/sequelize";
import { ListQuery, Rows } from "../service/page";
import { containsPattern } from "../utils/utility";
import { AssignmentKey } from "./assignment";

// Stock of one item at one outlet
export interface StockRecord {
    // The menu item's public id
    menuItemId: string;
    sku: string;
    name: string;
    quantity: number;
    // Switched on at the outlet and active at head office
    isSellable: boolean;
    updatedAt: Date;
}

export interface MovementRecord {
    publicId: string;
    delta: number;
    quantityAfter: number;
    reason: StockReason;
    userName: string | null;
    note: string | null;
    createdAt: Date;
}

// Internal integer ids
export interface NewMovement extends AssignmentKey {
    delta: number;
    quantityAfter: number;
    reason: StockReason;
    userId: number | null;
    note: string | null;
}

export interface LowStockRecord {
    // Public ids
    outletId: string;
    outletCode: string;
    outletName: string;
    menuItemId: string;
    sku: string;
    name: string;
    quantity: number;
}

export interface InventoryRepoInterface {
    findOne(key: AssignmentKey, transaction?: Transaction): Promise<StockRecord | null>;
    listByOutlet(outletId: number, query: ListQuery): Promise<Rows<StockRecord>>;
    changeQuantity(key: AssignmentKey, delta: number, transaction: Transaction): Promise<number | null>;
    addMovement(movement: NewMovement, transaction: Transaction): Promise<MovementRecord>;
    listMovements(key: AssignmentKey, query: ListQuery): Promise<Rows<MovementRecord>>;
    listLowStock(threshold: number, query: ListQuery): Promise<Rows<LowStockRecord>>;
}

const STOCK_COLUMNS = `
    m.public_id AS "menuItemId",
    m.sku AS "sku",
    m.name AS "name",
    i.quantity AS "quantity",
    (a.is_available AND m.is_active) AS "isSellable",
    i.updated_at AS "updatedAt"`;

const STOCK_JOINS = `
    FROM inventory i
    JOIN menu_items m ON m.id = i.menu_item_id
    JOIN outlet_menu_items a ON a.outlet_id = i.outlet_id AND a.menu_item_id = i.menu_item_id`;

const movementColumns = (table: string) => `
    ${table}.public_id AS "publicId",
    ${table}.delta AS "delta",
    ${table}.quantity_after AS "quantityAfter",
    ${table}.reason AS "reason",
    ${table}.note AS "note",
    ${table}.created_at AS "createdAt"`;

interface PagedQuery {
    columns: string;
    from: string;
    where: string;
    orderBy: string;
    replacements: Record<string, unknown>;
}

export class InventoryRepo implements InventoryRepoInterface {
    public async findOne(key: AssignmentKey, transaction?: Transaction): Promise<StockRecord | null> {
        const rows = await newSequelize().query<StockRecord>(
            `SELECT ${STOCK_COLUMNS} ${STOCK_JOINS}
             WHERE i.outlet_id = :outletId AND i.menu_item_id = :menuItemId`,
            { replacements: { ...key }, type: QueryTypes.SELECT, transaction }
        );
        return rows[0] ?? null;
    }

    public async listByOutlet(outletId: number, query: ListQuery): Promise<Rows<StockRecord>> {
        const search = query.search ? " AND (m.name ILIKE :pattern OR m.sku ILIKE :pattern)" : "";
        return this.page<StockRecord>(
            {
                columns: STOCK_COLUMNS,
                from: STOCK_JOINS,
                where: `i.outlet_id = :outletId${search}`,
                orderBy: "m.name, m.id",
                replacements: { outletId, pattern: query.search ? containsPattern(query.search) : null },
            },
            query
        );
    }

    // The one safe way to change stock: check and write in a single statement, so two changes at the same
    // moment can never take the quantity out of bounds. null: refused, nothing changed.
    // The row stays locked until the transaction ends.
    public async changeQuantity(key: AssignmentKey, delta: number, transaction: Transaction): Promise<number | null> {
        const rows = await newSequelize().query<{ quantity: number }>(
            `UPDATE inventory
             SET quantity = quantity + :delta, updated_at = now()
             WHERE outlet_id = :outletId AND menu_item_id = :menuItemId
               AND quantity + :delta BETWEEN 0 AND :max
             RETURNING quantity`,
            { replacements: { ...key, delta, max: STOCK_MAX }, type: QueryTypes.SELECT, transaction }
        );
        return rows[0]?.quantity ?? null;
    }

    public async addMovement(movement: NewMovement, transaction: Transaction): Promise<MovementRecord> {
        const rows = await newSequelize().query<MovementRecord>(
            `INSERT INTO stock_movements
                 (outlet_id, menu_item_id, delta, quantity_after, reason, user_id, note)
             VALUES (:outletId, :menuItemId, :delta, :quantityAfter, :reason, :userId, :note)
             RETURNING ${movementColumns("stock_movements")},
                 (SELECT full_name FROM users u WHERE u.id = stock_movements.user_id) AS "userName"`,
            { replacements: { ...movement }, type: QueryTypes.SELECT, transaction }
        );
        return rows[0];
    }

    // Newest first. Ids are given while the stock row is locked, so they follow the order of the changes.
    public async listMovements(key: AssignmentKey, query: ListQuery): Promise<Rows<MovementRecord>> {
        return this.page<MovementRecord>(
            {
                columns: `${movementColumns("s")}, u.full_name AS "userName"`,
                from: "FROM stock_movements s LEFT JOIN users u ON u.id = s.user_id",
                where: "s.outlet_id = :outletId AND s.menu_item_id = :menuItemId",
                orderBy: "s.id DESC",
                replacements: { ...key },
            },
            query
        );
    }

    // Only what can be sold: an open outlet, with the item switched on there and active at head office
    public async listLowStock(threshold: number, query: ListQuery): Promise<Rows<LowStockRecord>> {
        return this.page<LowStockRecord>(
            {
                columns: `
                    o.public_id AS "outletId",
                    o.code AS "outletCode",
                    o.name AS "outletName",
                    m.public_id AS "menuItemId",
                    m.sku AS "sku",
                    m.name AS "name",
                    i.quantity AS "quantity"`,
                from: `${STOCK_JOINS} JOIN outlets o ON o.id = i.outlet_id`,
                where: "i.quantity <= :threshold AND a.is_available AND m.is_active AND o.is_active",
                orderBy: "i.quantity, o.code, m.name, m.id",
                replacements: { threshold },
            },
            query
        );
    }

    // Everything but the replacement values is fixed text from this file
    private async page<T extends object>(
        { columns, from, where, orderBy, replacements }: PagedQuery,
        { offset, limit }: ListQuery
    ): Promise<Rows<T>> {
        const values = { ...replacements, offset, limit };
        const [rows, counted] = await Promise.all([
            newSequelize().query<T>(
                `SELECT ${columns} ${from} WHERE ${where} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`,
                { replacements: values, type: QueryTypes.SELECT }
            ),
            newSequelize().query<{ total: number }>(
                `SELECT CAST(COUNT(*) AS INTEGER) AS total ${from} WHERE ${where}`,
                { replacements: values, type: QueryTypes.SELECT }
            ),
        ]);
        return { rows, total: counted[0].total };
    }
}

export const newInventoryRepo = async (): Promise<InventoryRepoInterface> => {
    return new InventoryRepo();
};
