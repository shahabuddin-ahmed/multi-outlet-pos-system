import { randomUUID } from "crypto";
import { Express } from "express";
import request from "supertest";
import { API_PREFIX, IDEMPOTENCY_HEADER } from "../../../../constant/api";
import { UserRole } from "../../../../constant/auth";
import newSequelize from "../../../../infra/sequelize";
import { resetTestData } from "../../../../infra/test/test-database";
import { vatOf } from "../../../../service/sale-rules";
import { startTestApp } from "./test-app";
import { signInAs } from "./test-auth";
import { assignItem, menuItemService, newItem, newOutlet } from "./test-fixtures";
import { expectNoInternalIds } from "./test-guards";

const PRICE = 10000;
const SKUS = ["AA", "BB", "CC", "DD", "EE", "FF", "GG"];

let app: Express;
let headOffice: string;
let manager: string;
let cashier: string;
let dhk: string;
let gul: string;
let items: Record<string, string>;

beforeAll(async () => {
    app = await startTestApp();
});

// DHK makes two sales and GUL one; OLD never sells
beforeEach(async () => {
    await resetTestData();
    dhk = (await newOutlet("DHK")).publicId;
    gul = (await newOutlet("GUL")).publicId;
    await newOutlet("OLD");
    headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;
    manager = (await signInAs(app, UserRole.OUTLET_MANAGER, "DHK")).token;
    cashier = (await signInAs(app, UserRole.CASHIER, "DHK")).token;
    const gulCashier = (await signInAs(app, UserRole.CASHIER, "GUL")).token;

    items = {};
    for (const sku of SKUS) {
        items[sku] = (await newItem(sku, PRICE)).publicId;
    }
    for (const outlet of [dhk, gul]) {
        for (const sku of SKUS) {
            await assignItem(outlet, items[sku]);
            await post(`/outlets/${outlet}/inventory/${items[sku]}/adjustments`, headOffice, {
                delta: 50,
                reason: "RESTOCK",
            });
        }
    }

    await sell(dhk, cashier, { AA: 7, BB: 6, CC: 5 });
    await sell(dhk, cashier, { DD: 5, EE: 3, FF: 2, GG: 1 });
    await sell(gul, gulCashier, { AA: 1 });
});

afterAll(async () => {
    await newSequelize().close();
});

const post = async (path: string, token: string, body: object) => {
    const res = await request(app)
        .post(`${API_PREFIX}${path}`)
        .set("Authorization", `Bearer ${token}`)
        .set(IDEMPOTENCY_HEADER, randomUUID())
        .send(body);
    expect(res.status).toBe(201);
};

const sell = async (outlet: string, token: string, basket: Record<string, number>) => {
    const lines = Object.entries(basket).map(([sku, quantity]) => ({ menuItemId: items[sku], quantity }));
    const subtotal = lines.reduce((sum, line) => sum + line.quantity * PRICE, 0);
    await post(`/outlets/${outlet}/sales`, token, {
        orderType: "TAKEAWAY",
        payment: { method: "CARD" },
        expectedTotalCents: subtotal + vatOf(subtotal, 500),
        items: lines,
    });
};

const get = (path: string, token: string = headOffice) =>
    request(app).get(`${API_PREFIX}${path}`).set("Authorization", `Bearer ${token}`);

const revenue = async (query = "") => (await get(`/reports/revenue-by-outlet?${query}`)).body.response;
const countsOf = async (query: string) => (await revenue(query)).data.map((row: any) => row.salesCount);

const dhakaDay = (daysAgo: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(Date.now() - daysAgo * 86_400_000);

// Moves the second DHK sale well into the past
const makeOldSale = () =>
    newSequelize().query(
        `UPDATE sales SET created_at = created_at - INTERVAL '40 days'
         WHERE receipt_no = 2 AND outlet_id = (SELECT id FROM outlets WHERE code = 'DHK')`
    );

describe("revenue by outlet", () => {
    it("lists every outlet with its sales, also one without any, and the totals", async () => {
        const report = await revenue();

        expect(report.data).toMatchObject([
            { outlet: { code: "DHK" }, salesCount: 2, netSalesCents: 290000, vatCents: 14500, totalCents: 304500 },
            { outlet: { code: "GUL" }, salesCount: 1, netSalesCents: 10000, vatCents: 500, totalCents: 10500 },
            { outlet: { code: "OLD" }, salesCount: 0, netSalesCents: 0, vatCents: 0, totalCents: 0 },
        ]);
        expect(report.totals).toEqual({ salesCount: 3, netSalesCents: 300000, vatCents: 15000, totalCents: 315000 });
        expect(report.period).toEqual({ from: null, to: null, timezone: "Asia/Dhaka" });
        // Totals cover all outlets, whatever page is shown
        expect((await revenue("limit=1")).totals.salesCount).toBe(3);
        expectNoInternalIds(report);
    });

    it("counts only the chosen days", async () => {
        await makeOldSale();

        expect(await countsOf("range=today")).toEqual([1, 1, 0]);
        expect(await countsOf("range=month")).toEqual([1, 1, 0]);
        expect(await countsOf("")).toEqual([2, 1, 0]);
        expect(await countsOf(`from=${dhakaDay(40)}&to=${dhakaDay(40)}`)).toEqual([1, 0, 0]);
        expect((await revenue(`to=${dhakaDay(1)}`)).totals.salesCount).toBe(1);
    });

    it("refuses a period that makes no sense", async () => {
        for (const query of [
            "range=week",
            `range=today&from=${dhakaDay(0)}`,
            `from=${dhakaDay(0)}&to=${dhakaDay(1)}`,
            "from=yesterday",
            "from=2026-02-30",
        ]) {
            expect([query, (await get(`/reports/revenue-by-outlet?${query}`)).status]).toEqual([query, 400]);
        }
    });

    // PostgreSQL has no year 0000; such a date must be refused before it reaches the database
    it("refuses a year no sale can have, in reports and in sales history", async () => {
        for (const path of ["/reports/revenue-by-outlet", "/reports/top-items", "/sales"]) {
            for (const query of ["from=0000-01-01", "to=0000-12-31", "from=1899-12-31", "to=3000-01-01"]) {
                const status = (await get(`${path}?${query}`)).status;
                expect([path, query, status]).toEqual([path, query, 400]);
            }
            expect((await get(`${path}?from=1900-01-01&to=2999-12-31`)).status).toBe(200);
        }
    });
});

describe("top items", () => {
    const topOf = async (query = "") => (await get(`/reports/top-items?${query}`)).body.response;
    const linesOf = (report: any, index: number) =>
        report.data[index].items.map((item: any) => [item.sku, item.quantity]);

    it("gives each outlet its five best sellers by quantity, equal ones by name", async () => {
        const report = await topOf();

        expect(linesOf(report, 0)).toEqual([
            ["AA", 7],
            ["BB", 6],
            ["CC", 5],
            ["DD", 5],
            ["EE", 3],
        ]);
        expect(linesOf(report, 1)).toEqual([["AA", 1]]);
        expect(linesOf(report, 2)).toEqual([]);
        expect(report.data[0].items[0]).toMatchObject({ menuItemId: items.AA, netSalesCents: 70000 });
        expectNoInternalIds(report);
    });

    it("keeps items apart after a rename, and shows the current name", async () => {
        await menuItemService.update(items.BB, { name: "Item AA" });

        const report = await topOf(`outletId=${dhk}`);

        expect(report.total).toBe(1);
        expect(report.data[0].items.slice(0, 2)).toMatchObject([
            { sku: "AA", name: "Item AA", quantity: 7 },
            { sku: "BB", name: "Item AA", quantity: 6 },
        ]);
    });

    it("counts only the chosen days", async () => {
        await makeOldSale();

        const report = await topOf(`range=today&outletId=${dhk}`);

        expect(linesOf(report, 0)).toEqual([
            ["AA", 7],
            ["BB", 6],
            ["CC", 5],
        ]);
    });
});

describe("who may see reports", () => {
    it("is head office only", async () => {
        for (const token of [manager, cashier]) {
            expect((await get("/reports/revenue-by-outlet", token)).status).toBe(403);
            expect((await get(`/reports/top-items?outletId=${dhk}`, token)).status).toBe(403);
        }
        expect((await get(`/reports/top-items?outletId=${gul}`)).status).toBe(200);
    });
});
