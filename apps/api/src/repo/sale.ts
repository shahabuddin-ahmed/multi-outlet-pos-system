import { QueryTypes, Transaction } from "sequelize";
import { OrderType, PaymentMethod } from "../constant/sale";
import newSequelize from "../infra/sequelize";
import { ListQuery, Rows } from "../service/page";
import { onOrAfterDay, onOrBeforeDay } from "./day-range";

// What a receipt prints besides the sale itself, saved with the sale
export interface ReceiptSnapshot {
    companyName: string;
    companyTaxNo: string;
    footer: string;
    currency: string;
    timezone: string;
    cashierName: string;
    outlet: { code: string; name: string; address: string | null; phone: string | null };
}

export interface SaleItemRecord {
    // The menu item's public id
    menuItemId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
}

// Internal integer ids
export interface NewSale {
    outletId: number;
    userId: number;
    receiptNo: number;
    orderType: OrderType;
    tableLabel: string | null;
    subtotalCents: number;
    vatBps: number;
    vatCents: number;
    totalCents: number;
    paymentMethod: PaymentMethod;
    tenderedCents: number | null;
    paymentReference: string | null;
    snapshot: ReceiptSnapshot;
}

export interface NewSaleItem {
    menuItemId: number;
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
}

export interface SaleRecord extends NewSale {
    id: number;
    publicId: string;
    createdAt: Date;
    items: SaleItemRecord[];
}

// One row of the sales history
export interface SaleSummaryRecord {
    publicId: string;
    outletPublicId: string;
    receiptNo: number;
    orderType: OrderType;
    tableLabel: string | null;
    paymentMethod: PaymentMethod;
    totalCents: number;
    itemCount: number;
    snapshot: ReceiptSnapshot;
    createdAt: Date;
}

// Every given condition must hold
export interface SaleFilter {
    // The outlet that was asked for
    outletId?: number;
    // What the signed-in user is limited to
    visibleOutletId?: number;
    visibleUserId?: number;
    receiptNo?: number;
    outletCode?: string;
    // Calendar days (YYYY-MM-DD) in the given time zone, both included
    from?: string;
    to?: string;
    timezone: string;
}

export interface SaleRepoInterface {
    nextReceiptNumber(outletId: number, transaction: Transaction): Promise<number>;
    create(sale: NewSale, transaction: Transaction): Promise<number>;
    addItems(saleId: number, outletId: number, items: NewSaleItem[], transaction: Transaction): Promise<void>;
    findById(id: number, transaction?: Transaction): Promise<SaleRecord | null>;
    findByPublicId(publicId: string): Promise<SaleRecord | null>;
    list(filter: SaleFilter, query: ListQuery): Promise<Rows<SaleSummaryRecord>>;
}

// PostgreSQL returns BIGINT as text. The amounts here stay far below the largest exact JavaScript number.
const toNumber = (value: string | number): number => Number(value);

// Fixed SQL for each filter; the values only go through replacements
const FILTER_SQL: Record<Exclude<keyof SaleFilter, "timezone">, string> = {
    outletId: "s.outlet_id = :outletId",
    visibleOutletId: "s.outlet_id = :visibleOutletId",
    visibleUserId: "s.user_id = :visibleUserId",
    receiptNo: "s.receipt_no = :receiptNo",
    outletCode: "o.code = :outletCode",
    from: onOrAfterDay("s.created_at"),
    to: onOrBeforeDay("s.created_at"),
};

export class SaleRepo implements SaleRepoInterface {
    // Locks the outlet's counter until the transaction ends, so numbers have no gaps and no repeats:
    // a sale that fails gives its number back by rolling back.
    public async nextReceiptNumber(outletId: number, transaction: Transaction): Promise<number> {
        const rows = await newSequelize().query<{ receiptNo: number }>(
            `UPDATE outlet_receipt_counters SET last_number = last_number + 1, updated_at = now()
             WHERE outlet_id = :outletId
             RETURNING last_number AS "receiptNo"`,
            { replacements: { outletId }, type: QueryTypes.SELECT, transaction }
        );
        return rows[0].receiptNo;
    }

    public async create(sale: NewSale, transaction: Transaction): Promise<number> {
        const rows = await newSequelize().query<{ id: number }>(
            `INSERT INTO sales (outlet_id, user_id, receipt_no, order_type, table_label, subtotal_cents, vat_bps,
                 vat_cents, total_cents, payment_method, tendered_cents, payment_reference, receipt_snapshot)
             VALUES (:outletId, :userId, :receiptNo, :orderType, :tableLabel, :subtotalCents, :vatBps,
                 :vatCents, :totalCents, :paymentMethod, :tenderedCents, :paymentReference, :snapshot)
             RETURNING id`,
            {
                replacements: { ...sale, snapshot: JSON.stringify(sale.snapshot) },
                type: QueryTypes.SELECT,
                transaction,
            }
        );
        return rows[0].id;
    }

    public async addItems(
        saleId: number,
        outletId: number,
        items: NewSaleItem[],
        transaction: Transaction
    ): Promise<void> {
        await newSequelize()
            .getQueryInterface()
            .bulkInsert(
                "sale_items",
                items.map((item) => ({
                    sale_id: saleId,
                    outlet_id: outletId,
                    menu_item_id: item.menuItemId,
                    item_name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    unit_price_cents: item.unitPriceCents,
                    line_total_cents: item.lineTotalCents,
                })),
                { transaction }
            );
    }

    public async findById(id: number, transaction?: Transaction): Promise<SaleRecord | null> {
        return this.findWhere("s.id = :value", id, transaction);
    }

    public async findByPublicId(publicId: string): Promise<SaleRecord | null> {
        return this.findWhere("s.public_id = :value", publicId);
    }

    public async list(filter: SaleFilter, { offset, limit }: ListQuery): Promise<Rows<SaleSummaryRecord>> {
        const used = (Object.keys(FILTER_SQL) as (keyof typeof FILTER_SQL)[]).filter(
            (key) => filter[key] !== undefined
        );
        const where = used.map((key) => FILTER_SQL[key]).join(" AND ") || "TRUE";
        const from = "FROM sales s JOIN outlets o ON o.id = s.outlet_id";
        const replacements = { ...filter, offset, limit };

        const [rows, counted] = await Promise.all([
            newSequelize().query<SaleSummaryRecord>(
                `SELECT s.public_id AS "publicId",
                        o.public_id AS "outletPublicId",
                        s.receipt_no AS "receiptNo",
                        s.order_type AS "orderType",
                        s.table_label AS "tableLabel",
                        s.payment_method AS "paymentMethod",
                        s.total_cents AS "totalCents",
                        (SELECT CAST(SUM(quantity) AS INTEGER) FROM sale_items i WHERE i.sale_id = s.id)
                            AS "itemCount",
                        s.receipt_snapshot AS "snapshot",
                        s.created_at AS "createdAt"
                 ${from} WHERE ${where}
                 ORDER BY s.created_at DESC, s.id DESC
                 LIMIT :limit OFFSET :offset`,
                { replacements, type: QueryTypes.SELECT }
            ),
            newSequelize().query<{ total: number }>(
                `SELECT CAST(COUNT(*) AS INTEGER) AS total ${from} WHERE ${where}`,
                { replacements, type: QueryTypes.SELECT }
            ),
        ]);

        return {
            rows: rows.map((row) => ({ ...row, totalCents: toNumber(row.totalCents) })),
            total: counted[0].total,
        };
    }

    // The condition is fixed text from this file; the value only goes through replacements
    private async findWhere(
        condition: string,
        value: number | string,
        transaction?: Transaction
    ): Promise<SaleRecord | null> {
        const sales = await newSequelize().query<Omit<SaleRecord, "items">>(
            `SELECT s.id AS "id",
                    s.public_id AS "publicId",
                    s.outlet_id AS "outletId",
                    s.user_id AS "userId",
                    s.receipt_no AS "receiptNo",
                    s.order_type AS "orderType",
                    s.table_label AS "tableLabel",
                    s.subtotal_cents AS "subtotalCents",
                    s.vat_bps AS "vatBps",
                    s.vat_cents AS "vatCents",
                    s.total_cents AS "totalCents",
                    s.payment_method AS "paymentMethod",
                    s.tendered_cents AS "tenderedCents",
                    s.payment_reference AS "paymentReference",
                    s.receipt_snapshot AS "snapshot",
                    s.created_at AS "createdAt"
             FROM sales s WHERE ${condition}`,
            { replacements: { value }, type: QueryTypes.SELECT, transaction }
        );
        const sale = sales[0];
        if (!sale) {
            return null;
        }

        // Lines in the order they were saved, which is the order the cashier added them
        const items = await newSequelize().query<SaleItemRecord>(
            `SELECT m.public_id AS "menuItemId",
                    i.item_name AS "name",
                    i.sku AS "sku",
                    i.quantity AS "quantity",
                    i.unit_price_cents AS "unitPriceCents",
                    i.line_total_cents AS "lineTotalCents"
             FROM sale_items i JOIN menu_items m ON m.id = i.menu_item_id
             WHERE i.sale_id = :saleId
             ORDER BY i.id`,
            { replacements: { saleId: sale.id }, type: QueryTypes.SELECT, transaction }
        );

        return {
            ...sale,
            subtotalCents: toNumber(sale.subtotalCents),
            vatCents: toNumber(sale.vatCents),
            totalCents: toNumber(sale.totalCents),
            tenderedCents: sale.tenderedCents === null ? null : toNumber(sale.tenderedCents),
            items: items.map((item) => ({ ...item, lineTotalCents: toNumber(item.lineTotalCents) })),
        };
    }
}

export const newSaleRepo = async (): Promise<SaleRepoInterface> => {
    return new SaleRepo();
};
