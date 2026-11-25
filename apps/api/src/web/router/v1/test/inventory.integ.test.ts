import { randomUUID } from "crypto";
import { Express } from "express";
import request from "supertest";
import { API_PREFIX, IDEMPOTENCY_HEADER, UUID_PATTERN } from "../../../../constant/api";
import { UserRole } from "../../../../constant/auth";
import newSequelize from "../../../../infra/sequelize";
import { resetTestData } from "../../../../infra/test/test-database";
import { startTestApp } from "./test-app";
import { signInAs } from "./test-auth";
import { assignItem, menuItemService, newItem, newOutlet, outletService } from "./test-fixtures";

let app: Express;
let outlet: string;
let item: string;
let manager: string;

beforeAll(async () => {
    app = await startTestApp();
});

beforeEach(async () => {
    await resetTestData();
    outlet = (await newOutlet("DHK")).publicId;
    item = (await newItem("BG-001")).publicId;
    await assignItem(outlet, item);
    manager = (await signInAs(app, UserRole.OUTLET_MANAGER, "DHK")).token;
});

afterAll(async () => {
    await newSequelize().close();
});

const get = (path: string, token: string = manager) =>
    request(app).get(`${API_PREFIX}${path}`).set("Authorization", `Bearer ${token}`);

// Each call is a new change unless a retry key is given
const adjust = (
    body: object,
    token: string = manager,
    outletId: string = outlet,
    itemId: string = item,
    key: string = randomUUID()
) =>
    request(app)
        .post(`${API_PREFIX}/outlets/${outletId}/inventory/${itemId}/adjustments`)
        .set("Authorization", `Bearer ${token}`)
        .set(IDEMPOTENCY_HEADER, key)
        .send(body);

const retry = (body: object, key: string, token: string = manager, itemId: string = item) =>
    adjust(body, token, outlet, itemId, key);

const stockNow = async (): Promise<number> => (await get(`/outlets/${outlet}/inventory`)).body.response.data[0].stock;

const history = async () => (await get(`/outlets/${outlet}/inventory/${item}/movements`)).body.response;

describe("stock changes", () => {
    it("records every change with the quantity after it and who made it", async () => {
        const delivery = await adjust({ delta: 10, reason: "RESTOCK", note: "Morning delivery" });
        await adjust({ delta: -3, reason: "WASTE" });
        await adjust({ delta: 1, reason: "ADJUSTMENT", note: "" });

        const { data, total } = await history();
        const stock = (await get(`/outlets/${outlet}/inventory`)).body.response.data[0];

        expect(delivery.status).toBe(201);
        expect(delivery.body.response).toMatchObject({ quantityAfter: 10, note: "Morning delivery" });
        expect(delivery.body.response.id).toMatch(UUID_PATTERN);
        expect(total).toBe(3);
        // Newest first
        expect(data.map((row: any) => [row.delta, row.quantityAfter])).toEqual([
            [1, 8],
            [-3, 7],
            [10, 10],
        ]);
        expect(data[0]).toMatchObject({ reason: "ADJUSTMENT", note: null, userName: "Test User" });
        expect(stock).toMatchObject({ menuItemId: item, stock: 8, lowStock: false, outOfStock: false });
    });

    it("never goes below zero or above the limit, and writes nothing when refused", async () => {
        await adjust({ delta: 5, reason: "RESTOCK" });

        const tooMuch = await adjust({ delta: -6, reason: "WASTE" });
        const tooMany = await adjust({ delta: 1_000_000, reason: "ADJUSTMENT" });

        expect(tooMuch.status).toBe(409);
        expect(tooMuch.body).toMatchObject({ code: "E_INSUFFICIENT_STOCK", message: "Only 5 in stock" });
        expect(tooMany.status).toBe(422);
        expect(await stockNow()).toBe(5);
        expect((await history()).total).toBe(1);
    });

    it("accepts whole numbers, a manual reason and the right direction only", async () => {
        await adjust({ delta: 5, reason: "RESTOCK" });
        const refused = [
            { delta: 0, reason: "ADJUSTMENT" },
            { delta: 1.5, reason: "ADJUSTMENT" },
            { delta: "2", reason: "ADJUSTMENT" },
            { delta: -1, reason: "SALE" },
            { delta: -1, reason: "RESTOCK" },
            { delta: 1, reason: "WASTE" },
            { delta: 1 },
        ];

        for (const body of refused) {
            expect([body, (await adjust(body)).status]).toEqual([body, 400]);
        }
        expect(await stockNow()).toBe(5);
    });

    it("stays correct when many changes arrive at once", async () => {
        await adjust({ delta: 10, reason: "RESTOCK" });

        const answers = await Promise.all(Array.from({ length: 20 }, () => adjust({ delta: -1, reason: "WASTE" })));
        const { data } = await history();

        expect(answers.filter((res) => res.status === 201)).toHaveLength(10);
        expect(answers.filter((res) => res.status === 409)).toHaveLength(10);
        expect(await stockNow()).toBe(0);
        // One unbroken chain, newest first: 0, 1, 2 ... 10
        expect(data.map((row: any) => row.quantityAfter)).toEqual(Array.from({ length: 11 }, (_, index) => index));
    });

    it("answers 404 for an item the outlet does not sell", async () => {
        const other = (await newItem("PZ-001")).publicId;

        const change = await adjust({ delta: 1, reason: "RESTOCK" }, manager, outlet, other);
        const rows = await get(`/outlets/${outlet}/inventory/${other}/movements`);

        expect([change.status, rows.status]).toEqual([404, 404]);
        expect(change.body.code).toBe("E_ITEM_NOT_ASSIGNED");
    });

    it("keeps the history rules in the database", async () => {
        await expect(
            newSequelize().query(
                `INSERT INTO stock_movements (outlet_id, menu_item_id, delta, quantity_after, reason)
                 SELECT outlet_id, menu_item_id, -1, 0, 'RESTOCK' FROM inventory`
            )
        ).rejects.toMatchObject({ name: "SequelizeDatabaseError" });
    });
});

describe("a stock change sent again", () => {
    it("is applied once, and the retry gets the same answer", async () => {
        const key = randomUUID();
        const body = { delta: 10, reason: "RESTOCK", note: "Delivery" };

        const first = await retry(body, key);
        const again = await retry(body, key);

        expect([first.status, again.status]).toEqual([201, 200]);
        expect(again.body.response).toEqual(first.body.response);
        expect(await stockNow()).toBe(10);
        expect((await history()).total).toBe(1);
    });

    it("is applied once when both copies arrive at the same moment", async () => {
        const key = randomUUID();

        const answers = await Promise.all(
            Array.from({ length: 10 }, () => retry({ delta: 4, reason: "RESTOCK" }, key))
        );

        expect(answers.map((res) => res.status).sort()).toEqual([...Array(9).fill(200), 201]);
        expect(await stockNow()).toBe(4);
        expect((await history()).total).toBe(1);
    });

    it("is answered even when the stock is used up by then", async () => {
        await adjust({ delta: 5, reason: "RESTOCK" });
        const key = randomUUID();
        await retry({ delta: -5, reason: "WASTE" }, key);

        const again = await retry({ delta: -5, reason: "WASTE" }, key);

        expect(again.status).toBe(200);
        expect(again.body.response.quantityAfter).toBe(0);
    });

    it("refuses the same key for a different change, item or person", async () => {
        const other = (await newItem("DR-001")).publicId;
        await assignItem(outlet, other);
        const headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;
        const key = randomUUID();
        const body = { delta: 5, reason: "RESTOCK" };
        await retry(body, key);

        const otherAmount = await retry({ ...body, delta: 6 }, key);
        const otherNote = await retry({ ...body, note: "Evening" }, key);
        const otherItem = await retry(body, key, manager, other);
        const otherPerson = await retry(body, key, headOffice);

        for (const res of [otherAmount, otherNote, otherItem]) {
            expect([res.status, res.body.code]).toEqual([409, "E_IDEMPOTENCY_KEY_REUSED"]);
        }
        expect(otherPerson.status).toBe(403);
        expect(await stockNow()).toBe(5);
    });

    it("can try the same key again after a refusal", async () => {
        const key = randomUUID();
        const refused = await retry({ delta: -1, reason: "WASTE" }, key);
        await adjust({ delta: 3, reason: "RESTOCK" });

        const accepted = await retry({ delta: -1, reason: "WASTE" }, key);

        expect([refused.status, accepted.status]).toEqual([409, 201]);
    });

    it("needs a valid key", async () => {
        const send = () =>
            request(app)
                .post(`${API_PREFIX}/outlets/${outlet}/inventory/${item}/adjustments`)
                .set("Authorization", `Bearer ${manager}`);
        const body = { delta: 1, reason: "RESTOCK" };

        const missing = await send().send(body);
        const notAnId = await send().set(IDEMPOTENCY_HEADER, "1").send(body);

        expect([missing.status, notAnId.status]).toEqual([400, 400]);
        expect((await history()).total).toBe(0);
    });
});

describe("who may see and change stock", () => {
    it("is for head office and the outlet's own manager", async () => {
        const cashier = (await signInAs(app, UserRole.CASHIER, "DHK")).token;
        await newOutlet("GUL");
        const otherManager = (await signInAs(app, UserRole.OUTLET_MANAGER, "GUL")).token;
        const headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;

        for (const token of [cashier, otherManager]) {
            expect((await get(`/outlets/${outlet}/inventory`, token)).status).toBe(403);
            expect((await adjust({ delta: 1, reason: "RESTOCK" }, token)).status).toBe(403);
        }
        expect((await adjust({ delta: 1, reason: "RESTOCK" }, headOffice)).status).toBe(201);
        expect((await get("/reports/low-stock", manager)).status).toBe(403);
    });
});

describe("low stock", () => {
    it("lists sellable items of open outlets with 5 or less, lowest first", async () => {
        const headOffice = (await signInAs(app, UserRole.HQ_ADMIN)).token;
        const closed = (await newOutlet("OLD")).publicId;
        // item (BG-001) stays at 0
        const stocked = async (sku: string, quantity: number, outletId: string = outlet) => {
            const itemId = (await newItem(sku)).publicId;
            await assignItem(outletId, itemId);
            await adjust({ delta: quantity, reason: "RESTOCK" }, headOffice, outletId, itemId);
            return itemId;
        };
        await stocked("FIVE", 5);
        await stocked("THREE", 3);
        await stocked("SIX", 6);
        await assignItem(outlet, await stocked("OFF-HERE", 1), false);
        await menuItemService.update(await stocked("OFF-HQ", 1), { isActive: false });
        await stocked("CLOSED", 2, closed);
        await outletService.update(closed, { isActive: false });

        const res = await get("/reports/low-stock", headOffice);

        expect(res.status).toBe(200);
        expect(res.body.response.data.map((row: any) => [row.sku, row.stock])).toEqual([
            ["BG-001", 0],
            ["THREE", 3],
            ["FIVE", 5],
        ]);
        expect(res.body.response.data[0]).toMatchObject({ outlet: { id: outlet, code: "DHK" }, outOfStock: true });
        expect(res.body.response.total).toBe(3);
    });
});
