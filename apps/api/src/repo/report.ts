import { QueryTypes } from "sequelize";
import newSequelize from "../infra/sequelize";
import { ListQuery, Rows } from "../service/page";
import { onOrAfterDay, onOrBeforeDay } from "./day-range";

// Calendar days (YYYY-MM-DD), both included; left out for "since the beginning" and "until now"
export interface ReportPeriod {
    from?: string;
    to?: string;
    timezone: string;
}

export interface SalesTotals {
    salesCount: number;
    // Before VAT
    netSalesCents: number;
    vatCents: number;
    totalCents: number;
}

export interface OutletRevenueRecord extends SalesTotals {
    // The outlet's public id
    outletId: string;
    code: string;
    name: string;
    isActive: boolean;
}

export interface TopItemRecord {
    // The outlet's internal id, to group the rows
    outletKey: number;
    // The menu item's public id
    menuItemId: string;
    sku: string;
    // The item's current name
    name: string;
    quantity: number;
    netSalesCents: number;
}

export interface ReportRepoInterface {
    revenueByOutlet(period: ReportPeriod, query: ListQuery): Promise<Rows<OutletRevenueRecord>>;
    revenueTotals(period: ReportPeriod): Promise<SalesTotals>;
    topItems(outletIds: number[], period: ReportPeriod, perOutlet: number): Promise<TopItemRecord[]>;
}

const TOTAL_COLUMNS = `
    CAST(COUNT(s.id) AS INTEGER) AS "salesCount",
    CAST(COALESCE(SUM(s.subtotal_cents), 0) AS BIGINT) AS "netSalesCents",
    CAST(COALESCE(SUM(s.vat_cents), 0) AS BIGINT) AS "vatCents",
    CAST(COALESCE(SUM(s.total_cents), 0) AS BIGINT) AS "totalCents"`;

const dayConditions = ({ from, to }: ReportPeriod): string[] => [
    ...(from ? [onOrAfterDay("s.created_at")] : []),
    ...(to ? [onOrBeforeDay("s.created_at")] : []),
];

// PostgreSQL returns BIGINT as text
const withNumbers = <T extends SalesTotals>(row: T): T => ({
    ...row,
    netSalesCents: Number(row.netSalesCents),
    vatCents: Number(row.vatCents),
    totalCents: Number(row.totalCents),
});

export class ReportRepo implements ReportRepoInterface {
    // Every outlet is listed, also one with no sales: the day conditions sit in the join, not in WHERE
    public async revenueByOutlet(
        period: ReportPeriod,
        { offset, limit }: ListQuery
    ): Promise<Rows<OutletRevenueRecord>> {
        const join = ["s.outlet_id = o.id", ...dayConditions(period)].join(" AND ");

        const [rows, counted] = await Promise.all([
            newSequelize().query<OutletRevenueRecord>(
                `SELECT o.public_id AS "outletId", o.code AS "code", o.name AS "name", o.is_active AS "isActive",
                        ${TOTAL_COLUMNS}
                 FROM outlets o
                 LEFT JOIN sales s ON ${join}
                 GROUP BY o.id
                 ORDER BY o.code
                 LIMIT :limit OFFSET :offset`,
                { replacements: { ...period, offset, limit }, type: QueryTypes.SELECT }
            ),
            newSequelize().query<{ total: number }>("SELECT CAST(COUNT(*) AS INTEGER) AS total FROM outlets", {
                type: QueryTypes.SELECT,
            }),
        ]);

        return { rows: rows.map(withNumbers), total: counted[0].total };
    }

    public async revenueTotals(period: ReportPeriod): Promise<SalesTotals> {
        const where = dayConditions(period).join(" AND ") || "TRUE";
        const rows = await newSequelize().query<SalesTotals>(`SELECT ${TOTAL_COLUMNS} FROM sales s WHERE ${where}`, {
            replacements: { ...period },
            type: QueryTypes.SELECT,
        });
        return withNumbers(rows[0]);
    }

    // The best selling items of each outlet, by quantity; equal quantities are ordered by name.
    // Grouped by item id, so a renamed item keeps its history and two items never merge.
    public async topItems(outletIds: number[], period: ReportPeriod, perOutlet: number): Promise<TopItemRecord[]> {
        const where = ["i.outlet_id IN (:outletIds)", ...dayConditions(period)].join(" AND ");
        const rows = await newSequelize().query<TopItemRecord>(
            `SELECT "outletKey", "menuItemId", "sku", "name", "quantity", "netSalesCents"
             FROM (
                 SELECT i.outlet_id AS "outletKey",
                        m.public_id AS "menuItemId",
                        m.sku AS "sku",
                        m.name AS "name",
                        CAST(SUM(i.quantity) AS INTEGER) AS "quantity",
                        CAST(SUM(i.line_total_cents) AS BIGINT) AS "netSalesCents",
                        ROW_NUMBER() OVER (
                            PARTITION BY i.outlet_id ORDER BY SUM(i.quantity) DESC, m.name, m.id
                        ) AS "place"
                 FROM sale_items i
                 JOIN sales s ON s.id = i.sale_id
                 JOIN menu_items m ON m.id = i.menu_item_id
                 WHERE ${where}
                 GROUP BY i.outlet_id, m.id
             ) ranked
             WHERE "place" <= :perOutlet
             ORDER BY "outletKey", "place"`,
            { replacements: { ...period, outletIds, perOutlet }, type: QueryTypes.SELECT }
        );
        return rows.map((row) => ({ ...row, netSalesCents: Number(row.netSalesCents) }));
    }
}

export const newReportRepo = async (): Promise<ReportRepoInterface> => {
    return new ReportRepo();
};
