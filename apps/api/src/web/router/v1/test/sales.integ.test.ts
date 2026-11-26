import { randomUUID } from "crypto";
import { Express } from "express";
import { QueryTypes } from "sequelize";
import request from "supertest";
import { API_PREFIX, IDEMPOTENCY_HEADER } from "../../../../constant/api";
import { UserRole } from "../../../../constant/auth";
import newSequelize from "../../../../infra/sequelize";
import { resetTestData } from "../../../../infra/test/test-database";
import { SaleClaimRepo } from "../../../../repo/sale-claim";
import { vatOf } from "../../../../service/sale-rules";
import { startTestApp } from "./test-app";
import { signInAs } from "./test-auth";
import { assignItem, menuItemService, newItem, newOutlet, outletService } from "./test-fixtures";
import { expectNoInternalIds } from "./test-guards";

const BURGER_PRICE = 35000;
const DRINK_PRICE = 8000;

let app: Express;
let outlet: string;
let burger: string;
let drink: string;
let manager: string;
let cashier: string;
let prices: Map<string, number>;

beforeAll(async () => {
    app = await startTestApp();
});

beforeEach(async () => {
    await resetTestData();
    outlet = (await newOutlet("DHK")).publicId;
    burger = (await newItem("BG-001", BURGER_PRICE)).publicId;
    drink = (await newItem("DR-001", DRINK_PRICE)).publicId;
    prices = new Map([
        [burger, BURGER_PRICE],
        [drink, DRINK_PRICE],
    ]);
    manager = (await signInAs(app, UserRole.OUTLET_MANAGER, "DHK")).token;
    cashier = (await signInAs(app, UserRole.CASHIER, "DHK")).token;
    for (const item of [burger, drink]) {
        await assignItem(outlet, item);
        await changeStock(item, 100);
    }
});

afterAll(async () => {
    await newSequelize().close();
});

interface Line {
    menuItemId: string;
    quantity: number;
}

const get = (path: string, token: string = manager) =>
    request(app).get(`${API_PREFIX}${path}`).set("Authorization", `Bearer ${token}`);

const changeStock = async (itemId: string, delta: number, token: string = manager, outletId: string = outlet) => {
    const res = await request(app)
        .post(`${API_PREFIX}/outlets/${outletId}/inventory/${itemId}/adjustments`)
        .set("Authorization", `Bearer ${token}`)
        .set(IDEMPOTENCY_HEADER, randomUUID())
        .send({ delta, reason: delta > 0 ? "RESTOCK" : "WASTE" });
    expect(res.status).toBe(201);
};

const line = (menuItemId: string, quantity = 1): Line => ({ menuItemId, quantity });

// What the till would show: subtotal plus 5% VAT
const totalOf = (items: Line[]): number => {
    const subtotal = items.reduce((sum, { menuItemId, quantity }) => sum + prices.get(menuItemId)! * quantity, 0);
    return subtotal + vatOf(subtotal, 500);
};

const order = (items: Line[] = [line(burger)], changes: object = {}) => ({
    orderType: "TAKEAWAY",
    payment: { method: "CARD" },
    expectedTotalCents: totalOf(items),
    items,
    ...changes,
});

const sell = (body: object = order(), { token = cashier, key = randomUUID() as string, outletId = outlet } = {}) =>
    request(app)
        .post(`${API_PREFIX}/outlets/${outletId}/sales`)
        .set("Authorization", `Bearer ${token}`)
        .set(IDEMPOTENCY_HEADER, key)
        .send(body);

const stockOf = async (itemId: string): Promise<number> => {
    const res = await get(`/outlets/${outlet}/inventory`);
    return res.body.response.data.find((row: any) => row.menuItemId === itemId).stock;
};

// Everything a sale writes, to prove that a refused sale left nothing behind
const written = async () => {
    const rows = await newSequelize().query(
        `SELECT (SELECT CAST(COUNT(*) AS INTEGER) FROM sales) AS "sales",
                (SELECT CAST(COUNT(*) AS INTEGER) FROM sale_items) AS "lines",
                (SELECT CAST(COUNT(*) AS INTEGER) FROM sale_idempotency) AS "keys",
                (SELECT CAST(COUNT(*) AS INTEGER) FROM stock_movements WHERE reason = 'SALE') AS "movements",
                (SELECT CAST(SUM(last_number) AS INTEGER) FROM outlet_receipt_counters) AS "lastReceipts"`,
        { type: QueryTypes.SELECT }
    );
    return rows[0];
};
const NOTHING = { sales: 0, lines: 0, keys: 0, movements: 0, lastReceipts: 0 };

const numbersOf = (answers: { body: any }[]): number[] =>
    answers.map((res) => res.body.response.receiptNumber).sort((a, b) => a - b);

const oneTo = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1);

describe("checkout", () => {
    it("saves the sale, takes the stock and gives a numbered receipt", async () => {
        const items = [line(burger, 2), line(drink), line(burger)];

        const res = await sell(
            order(items, {
                orderType: "DINE_IN",
                tableLabel: "T4",
                payment: { method: "CASH", cashReceivedCents: 120000 },
            })
        );
        const history = await get(`/outlets/${outlet}/inventory/${burger}/movements`);

        expect(res.status).toBe(201);
        expect(res.body.response).toMatchObject({
            receiptCode: "DHK-000001",
            tableLabel: "T4",
            items: [
                { menuItemId: burger, quantity: 3, unitPriceCents: 35000, lineTotalCents: 105000 },
                { menuItemId: drink, quantity: 1, unitPriceCents: 8000, lineTotalCents: 8000 },
            ],
            subtotalCents: 113000,
            vatBps: 500,
            vatCents: 5650,
            totalCents: 118650,
            payment: { method: "CASH", cashReceivedCents: 120000, changeCents: 1350, reference: null },
            header: { cashierName: "Test User", outlet: { code: "DHK", name: "Outlet DHK" } },
        });
        expectNoInternalIds(res.body);
        expect([await stockOf(burger), await stockOf(drink)]).toEqual([97, 99]);
        expect(history.body.response.data[0]).toMatchObject({
            reason: "SALE",
            delta: -3,
            quantityAfter: 97,
            receiptCode: "DHK-000001",
        });
    });

    it("refuses wrong input and saves nothing", async () => {
        const withQuantity = (quantity: unknown) =>
            order([line(burger)], { items: [{ menuItemId: burger, quantity }] });
        const bodies = [
            withQuantity(0),
            withQuantity(1.5),
            withQuantity("2"),
            order([line(burger, 600), line(burger, 401)]),
            order([], { expectedTotalCents: 0 }),
            // The client never sends a price
            order([line(burger)], { items: [{ menuItemId: burger, quantity: 1, unitPriceCents: 1 }] }),
            order([line(burger)], { tableLabel: "T1" }),
            order([line(burger)], { payment: { method: "CASH" } }),
            order([line(burger)], { payment: { method: "CARD", cashReceivedCents: 50000 } }),
        ];

        for (const body of bodies) {
            expect([body, (await sell(body)).status]).toEqual([body, 400]);
        }
        expect((await sell(order(), { key: "not-a-uuid" })).status).toBe(400);
        const withoutKey = await request(app)
            .post(`${API_PREFIX}/outlets/${outlet}/sales`)
            .set("Authorization", `Bearer ${cashier}`)
            .send(order());
        expect(withoutKey.status).toBe(400);
        expect(await written()).toEqual(NOTHING);
    });

    it("refuses an item that is not sold here", async () => {
        const unassigned = (await newItem("PZ-001")).publicId;
        prices.set(unassigned, 10000);
        await assignItem(outlet, drink, false);

        const res = await sell(order([line(burger), line(drink), line(unassigned)]));

        expect(res.status).toBe(422);
        expect(res.body.code).toBe("E_ITEM_NOT_SELLABLE");
        expect(res.body.response.items.map((item: any) => item.menuItemId)).toEqual([drink, unassigned]);
        expect(await written()).toEqual(NOTHING);
    });

    it("refuses cash that does not cover the total", async () => {
        const res = await sell(order([line(burger)], { payment: { method: "CASH", cashReceivedCents: 35000 } }));

        expect(res.status).toBe(422);
        expect(res.body.code).toBe("E_TENDER_TOO_LOW");
        expect(await written()).toEqual(NOTHING);
    });

    it("names every item that is short, keeps all stock and lets the same key try again", async () => {
        await changeStock(drink, -99);
        const key = randomUUID();

        const refused = await sell(order([line(burger, 101), line(drink, 2)]), { key });

        expect(refused.status).toBe(409);
        expect(refused.body.code).toBe("E_INSUFFICIENT_STOCK");
        expect(refused.body.errors).toEqual(["Item BG-001: 100 left", "Item DR-001: 1 left"]);
        expect(await written()).toEqual(NOTHING);

        const accepted = await sell(order([line(drink)]), { key });
        expect(accepted.status).toBe(201);
        expect(accepted.body.response.receiptNumber).toBe(1);
    });

    it("cancels the whole sale when only one item is short", async () => {
        await changeStock(drink, -99);

        // The burger is the older item, so its stock is taken before the drink turns out to be short
        const refused = await sell(order([line(burger, 2), line(drink, 2)]));

        expect(refused.status).toBe(409);
        expect(refused.body.code).toBe("E_INSUFFICIENT_STOCK");
        expect(refused.body.errors).toEqual(["Item DR-001: 1 left"]);
        expect(await written()).toEqual(NOTHING);
        expect([await stockOf(burger), await stockOf(drink)]).toEqual([100, 1]);
        // No receipt number was used up
        expect((await sell()).body.response.receiptNumber).toBe(1);
    });

    it("saves nothing when the price changed, and tells the new total", async () => {
        const body = order();
        const key = randomUUID();
        await menuItemService.update(burger, { basePriceCents: 36000 });

        const refused = await sell(body, { key });

        expect(refused.status).toBe(409);
        expect(refused.body.code).toBe("E_PRICE_CHANGED");
        expect(refused.body.response).toMatchObject({
            totalCents: 37800,
            lines: [{ menuItemId: burger, unitPriceCents: 36000 }],
        });
        expectNoInternalIds(refused.body);
        expect(await written()).toEqual(NOTHING);
        expect(await stockOf(burger)).toBe(100);

        // The cashier confirms the new total
        expect((await sell({ ...body, expectedTotalCents: 37800 }, { key })).status).toBe(201);
    });

    it("rolls everything back when the last step fails", async () => {
        const failure = jest.spyOn(SaleClaimRepo.prototype, "attachSale").mockRejectedValueOnce(new Error("forced"));
        const key = randomUUID();

        const failed = await sell(order(), { key });

        expect(failed.status).toBe(500);
        expect(await written()).toEqual(NOTHING);
        expect(await stockOf(burger)).toBe(100);
        // The receipt number was given back
        expect((await sell(order(), { key })).body.response.receiptNumber).toBe(1);
        failure.mockRestore();
    });

    it("keeps the money rules in the database", async () => {
        await sell();

        await expect(newSequelize().query("UPDATE sales SET total_cents = total_cents + 1")).rejects.toMatchObject({
            name: "SequelizeDatabaseError",
        });
    });
});

describe("many sales at once", () => {
    it("gives the last 10 items to 10 buyers, with receipts 1 to 10", async () => {
        await changeStock(burger, -90);

        const answers = await Promise.all(Array.from({ length: 50 }, () => sell()));
        const sold = answers.filter((res) => res.status === 201);
        const refused = answers.filter((res) => res.status === 409);

        expect([sold.length, refused.length]).toEqual([10, 40]);
        expect(refused.every((res) => res.body.code === "E_INSUFFICIENT_STOCK")).toBe(true);
        expect(numbersOf(sold)).toEqual(oneTo(10));
        expect(await stockOf(burger)).toBe(0);
        expect(await written()).toEqual({ sales: 10, lines: 10, keys: 10, movements: 10, lastReceipts: 10 });
    });

    it("numbers each outlet on its own, also for its very first sales", async () => {
        const other = (await newOutlet("GUL")).publicId;
        const otherCashier = (await signInAs(app, UserRole.CASHIER, "GUL")).token;
        const headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;
        await assignItem(other, burger);
        await changeStock(burger, 100, headOffice, other);

        const answers = await Promise.all(
            Array.from({ length: 30 }, (_, index) =>
                index % 2 === 0 ? sell() : sell(order(), { token: otherCashier, outletId: other })
            )
        );

        expect(answers.every((res) => res.status === 201)).toBe(true);
        expect(numbersOf(answers.filter((_, index) => index % 2 === 0))).toEqual(oneTo(15));
        expect(numbersOf(answers.filter((_, index) => index % 2 === 1))).toEqual(oneTo(15));
    });

    it("does not deadlock when baskets list the same items in opposite order", async () => {
        const baskets = [
            [line(burger), line(drink)],
            [line(drink), line(burger)],
        ];

        const answers = await Promise.all(Array.from({ length: 30 }, (_, index) => sell(order(baskets[index % 2]))));

        expect(answers.every((res) => res.status === 201)).toBe(true);
        expect(numbersOf(answers)).toEqual(oneTo(30));
        expect([await stockOf(burger), await stockOf(drink)]).toEqual([70, 70]);
    });
});

describe("retries", () => {
    it("makes one sale for one key, also when it is sent five times at once", async () => {
        const body = order();
        const key = randomUUID();

        const answers = await Promise.all(Array.from({ length: 5 }, () => sell(body, { key })));

        expect(answers.map((res) => res.status).sort()).toEqual([200, 200, 200, 200, 201]);
        expect(new Set(answers.map((res) => res.body.response.id)).size).toBe(1);
        expect(await written()).toEqual({ sales: 1, lines: 1, keys: 1, movements: 1, lastReceipts: 1 });
        expect(await stockOf(burger)).toBe(99);
    });

    it("accepts the same basket in another order, and refuses the key for anything else", async () => {
        const items = [line(burger), line(drink)];
        const payment = { method: "CARD", reference: "1111" };
        const key = randomUUID();
        const first = await sell(order(items, { payment }), { key });

        const reordered = await sell(order([...items].reverse(), { payment }), { key });
        const different = [
            order([line(burger, 2), line(drink)], { payment }),
            order(items, { payment: { method: "CARD", reference: "2222" } }),
            order(items, { payment, expectedTotalCents: 1 }),
        ];

        expect(reordered.status).toBe(200);
        expect(reordered.body.response.id).toBe(first.body.response.id);
        for (const body of different) {
            const res = await sell(body, { key });
            expect([res.status, res.body.code]).toEqual([409, "E_IDEMPOTENCY_KEY_REUSED"]);
        }
        // Another user cannot use it, not even the manager
        expect((await sell(order(items, { payment }), { key, token: manager })).status).toBe(403);
        expect(await written()).toMatchObject({ sales: 1, keys: 1 });
    });

    it("still answers a retry after the outlet and the item were switched off", async () => {
        const body = order();
        const key = randomUUID();
        const first = await sell(body, { key });
        await menuItemService.update(burger, { isActive: false });
        await outletService.update(outlet, { isActive: false });

        const retry = await sell(body, { key });
        const another = await sell(body);

        expect(retry.status).toBe(200);
        expect(retry.body.response).toEqual(first.body.response);
        expect([another.status, another.body.code]).toEqual([422, "E_OUTLET_INACTIVE"]);
        // Nothing else is open to them
        expect((await get(`/outlets/${outlet}/sales`, cashier)).status).toBe(403);
        expect(await written()).toMatchObject({ sales: 1 });
    });
});

describe("receipts and history", () => {
    it("never changes an old receipt", async () => {
        const sale = (await sell()).body.response;

        await outletService.update(outlet, { name: "New name", address: "New address" });
        await menuItemService.update(burger, { name: "New burger", basePriceCents: 99000 });
        await newSequelize().query("UPDATE users SET full_name = 'New cashier name'");
        const later = await get(`/outlets/${outlet}/sales/${sale.id}`, cashier);

        expect(later.status).toBe(200);
        expect(later.body.response).toEqual(sale);
    });

    it("shows each user only the sales they may see", async () => {
        const colleague = (await signInAs(app, UserRole.CASHIER, "DHK", "2")).token;
        const headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;
        const other = (await newOutlet("GUL")).publicId;
        const otherManager = (await signInAs(app, UserRole.OUTLET_MANAGER, "GUL")).token;
        const sale = (await sell()).body.response;
        await sell(order(), { token: colleague });

        const list = (token: string) => get(`/outlets/${outlet}/sales`, token);
        const receipt = (token: string, outletId: string = outlet) =>
            get(`/outlets/${outletId}/sales/${sale.id}`, token);

        expect((await list(cashier)).body.response.total).toBe(1);
        expect((await list(colleague)).body.response.total).toBe(1);
        expect((await list(manager)).body.response.total).toBe(2);
        expect((await list(headOffice)).body.response.total).toBe(2);
        expect((await receipt(cashier)).status).toBe(200);
        expect((await receipt(manager)).status).toBe(200);
        expect((await receipt(headOffice)).status).toBe(200);
        // A colleague and another outlet's manager are refused by the link as well
        expect((await receipt(colleague)).status).toBe(403);
        expect((await receipt(otherManager)).status).toBe(403);
        expect((await list(otherManager)).status).toBe(403);
        // The receipt belongs to DHK, so it does not exist under GUL
        expect((await receipt(headOffice, other)).status).toBe(404);

        expect((await get("/sales", headOffice)).body.response.total).toBe(2);
        expect((await get("/sales", manager)).status).toBe(403);
        expect((await get("/sales", cashier)).status).toBe(403);
        // Head office does not ring up sales
        expect((await sell(order(), { token: headOffice })).status).toBe(403);
    });

    it("finds sales by receipt number, outlet and day", async () => {
        const other = (await newOutlet("GUL")).publicId;
        const headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;
        const otherCashier = (await signInAs(app, UserRole.CASHIER, "GUL")).token;
        await assignItem(other, burger);
        await changeStock(burger, 10, headOffice, other);
        await sell();
        await sell();
        await sell(order(), { token: otherCashier, outletId: other });
        // A day as it is called in Dhaka
        const day = (offset: number) =>
            new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(Date.now() + offset * 86_400_000);
        const found = async (query: string) => (await get(`/sales?${query}`, headOffice)).body.response;

        const all = await found("");

        expect(all.data.map((row: any) => row.receiptCode)).toEqual(["GUL-000001", "DHK-000002", "DHK-000001"]);
        expect(all.data[0]).toMatchObject({ outlet: { id: other, code: "GUL" }, itemCount: 1, totalCents: 36750 });
        expectNoInternalIds(all);
        expect((await found("receipt=DHK-000002")).total).toBe(1);
        expect((await found("receipt=1")).total).toBe(2);
        expect((await found(`outletId=${other}`)).total).toBe(1);
        expect((await found(`from=${day(0)}&to=${day(0)}`)).total).toBe(3);
        expect((await found(`from=${day(1)}`)).total).toBe(0);
        expect((await found(`to=${day(-1)}`)).total).toBe(0);
        expect((await get(`/outlets/${outlet}/sales?receipt=GUL-000001`, manager)).body.response.total).toBe(0);
        for (const query of ["receipt=abc", "from=2026-02-30", `from=${day(1)}&to=${day(0)}`]) {
            expect([query, (await get(`/sales?${query}`, headOffice)).status]).toEqual([query, 400]);
        }
    });
});
