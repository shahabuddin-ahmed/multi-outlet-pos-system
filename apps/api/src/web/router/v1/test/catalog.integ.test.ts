import { randomUUID } from "crypto";
import { Express } from "express";
import { QueryTypes } from "sequelize";
import request from "supertest";
import { API_PREFIX, UUID_PATTERN } from "../../../../constant/api";
import { UserRole } from "../../../../constant/auth";
import newSequelize from "../../../../infra/sequelize";
import { resetTestData } from "../../../../infra/test/test-database";
import { startTestApp } from "./test-app";
import { signInAs } from "./test-auth";
import { expectNoInternalIds } from "./test-guards";

let app: Express;
// Everything here is head office work; who may do what is tested in auth.integ.test.ts
let authorization: string;

beforeAll(async () => {
    app = await startTestApp();
});

beforeEach(async () => {
    await resetTestData();
    authorization = `Bearer ${(await signInAs(app, UserRole.HQ_ADMIN)).token}`;
});

afterAll(async () => {
    await newSequelize().close();
});

const url = (path: string) => `${API_PREFIX}${path}`;
const get = (path: string) => request(app).get(url(path)).set("Authorization", authorization);
const post = (path: string, body: object) =>
    request(app).post(url(path)).set("Authorization", authorization).send(body);
const patch = (path: string, body: object) =>
    request(app).patch(url(path)).set("Authorization", authorization).send(body);
const put = (path: string, body: object) => request(app).put(url(path)).set("Authorization", authorization).send(body);

const createOutlet = async (changes: object = {}) => {
    const res = await post("/outlets", { code: "DHK", name: "Dhanmondi", ...changes });
    expect(res.status).toBe(201);
    return res.body.response;
};

const createItem = async (changes: object = {}) => {
    const res = await post("/menu-items", { sku: "BG-001", name: "Beef Burger", basePriceCents: 35000, ...changes });
    expect(res.status).toBe(201);
    return res.body.response;
};

const assign = (outletId: string, menuItemId: string, changes: object = {}) =>
    put(`/outlets/${outletId}/assignments/${menuItemId}`, {
        priceOverrideCents: null,
        isAvailable: true,
        ...changes,
    });

const countRows = async (table: string): Promise<number> => {
    const rows = await newSequelize().query<{ total: number }>(
        `SELECT CAST(COUNT(*) AS INTEGER) AS total FROM ${table}`,
        {
            type: QueryTypes.SELECT,
        }
    );
    return rows[0].total;
};

// The tills sell stock in a later phase; here the quantity is set straight in the database
const setStock = async (quantity: number): Promise<void> => {
    await newSequelize().query("UPDATE inventory SET quantity = :quantity", { replacements: { quantity } });
};

describe("outlets", () => {
    it("creates an outlet together with its receipt counter", async () => {
        const outlet = await createOutlet({ address: "Road 27", phone: "" });

        expect(outlet).toMatchObject({ code: "DHK", address: "Road 27", phone: null, isActive: true });
        expect(outlet.id).toMatch(UUID_PATTERN);
        const counters = await newSequelize().query('SELECT last_number AS "lastNumber" FROM outlet_receipt_counters', {
            type: QueryTypes.SELECT,
        });
        expect(counters).toEqual([{ lastNumber: 0 }]);
    });

    it("refuses a second outlet with the same code, also when both arrive together", async () => {
        const answers = await Promise.all([
            post("/outlets", { code: "DHK", name: "First" }),
            post("/outlets", { code: "DHK", name: "Second" }),
        ]);
        const later = await post("/outlets", { code: "DHK", name: "Third" });

        expect(answers.map((res) => res.status).sort()).toEqual([201, 409]);
        expect(later.status).toBe(409);
        expect(later.body.code).toBe("E_DUPLICATE_OUTLET_CODE");
        expect(await countRows("outlets")).toBe(1);
        expect(await countRows("outlet_receipt_counters")).toBe(1);
    });

    it("rejects bad input and never lets the code change", async () => {
        const outlet = await createOutlet();

        expect((await post("/outlets", { code: "d", name: "Small" })).status).toBe(400);
        expect((await post("/outlets", { code: "GUL", name: "  " })).status).toBe(400);
        expect((await post("/outlets", { code: "GUL", name: "Gulshan", id: 5 })).status).toBe(400);
        expect((await patch(`/outlets/${outlet.id}`, { code: "NEW" })).status).toBe(400);
        expect((await patch(`/outlets/${outlet.id}`, {})).status).toBe(400);
        // A database id is not an id for the API
        expect((await get("/outlets/1")).status).toBe(400);
        expect((await get(`/outlets/${randomUUID()}`)).status).toBe(404);
    });

    it("edits, switches off and searches outlets", async () => {
        const outlet = await createOutlet({ phone: "01700000000" });
        await createOutlet({ code: "GUL", name: "Gulshan" });

        const updated = await patch(`/outlets/${outlet.id}`, { name: "Dhanmondi 27", phone: null, isActive: false });
        const found = await get("/outlets?search=dhan&limit=1");
        const wildcard = await get("/outlets?search=%25");

        expect(updated.body.response).toMatchObject({ name: "Dhanmondi 27", phone: null, isActive: false });
        expect(found.body.response).toMatchObject({ total: 1, offset: 0, limit: 1 });
        expect(found.body.response.data[0].code).toBe("DHK");
        // % is searched as a normal character, not as "anything"
        expect(wildcard.body.response.total).toBe(0);
    });
});

describe("menu items", () => {
    it("keeps one item per SKU, ignoring upper and lower case", async () => {
        await createItem();

        const duplicate = await post("/menu-items", { sku: "bg-001", name: "Copy", basePriceCents: 100 });

        expect(duplicate.status).toBe(409);
        expect(duplicate.body.code).toBe("E_DUPLICATE_SKU");
    });

    it("accepts only a whole, non-negative price and never lets the SKU change", async () => {
        const item = await createItem();

        for (const basePriceCents of [-1, 10.5, "100", 10_000_001]) {
            const res = await post("/menu-items", { sku: "XX-1", name: "Bad", basePriceCents });
            expect(res.status).toBe(400);
        }
        expect((await patch(`/menu-items/${item.id}`, { sku: "BG-002" })).status).toBe(400);
        const updated = await patch(`/menu-items/${item.id}`, { basePriceCents: 36000 });
        expect(updated.body.response).toMatchObject({ sku: "BG-001", basePriceCents: 36000 });
    });

    it("is protected by the database even without the API checks", async () => {
        await expect(
            newSequelize().query("INSERT INTO menu_items (sku, name, base_price_cents) VALUES ('RAW-1', 'Raw', -1)")
        ).rejects.toMatchObject({ name: "SequelizeDatabaseError" });
    });
});

describe("assignments and the outlet menu", () => {
    it("assigns once: repeating changes the same row and keeps the stock", async () => {
        const outlet = await createOutlet();
        const item = await createItem();

        const first = await assign(outlet.id, item.id);
        await setStock(7);
        const second = await assign(outlet.id, item.id, { priceOverrideCents: 40000 });

        expect(first.status).toBe(201);
        expect(first.body.response).toMatchObject({ menuItemId: item.id, stock: 0 });
        expect(second.status).toBe(200);
        expect(second.body.response).toMatchObject({ effectivePriceCents: 40000, stock: 7 });
        expect(await countRows("outlet_menu_items")).toBe(1);
        expect(await countRows("inventory")).toBe(1);
    });

    it("keeps one row when the same assignment arrives several times at once", async () => {
        const outlet = await createOutlet();
        const item = await createItem();

        const answers = await Promise.all(Array.from({ length: 5 }, () => assign(outlet.id, item.id)));

        expect(answers.map((res) => res.status).sort()).toEqual([200, 200, 200, 200, 201]);
        expect(await countRows("outlet_menu_items")).toBe(1);
        expect(await countRows("inventory")).toBe(1);
    });

    it("uses the outlet price when set, even 0, and otherwise follows the master price", async () => {
        const outlet = await createOutlet();
        const item = await createItem();

        const free = await assign(outlet.id, item.id, { priceOverrideCents: 0 });
        const inherited = await assign(outlet.id, item.id, { priceOverrideCents: null });
        await patch(`/menu-items/${item.id}`, { basePriceCents: 38000 });
        const menu = await get(`/outlets/${outlet.id}/menu`);

        expect(free.body.response).toMatchObject({ effectivePriceCents: 0, priceSource: "OUTLET" });
        expect(inherited.body.response).toMatchObject({ effectivePriceCents: 35000, priceSource: "BASE" });
        expect(menu.body.response.data[0]).toMatchObject({ effectivePriceCents: 38000, priceSource: "BASE" });
    });

    it("rejects an incomplete body and unknown records", async () => {
        const outlet = await createOutlet();
        const item = await createItem();
        const path = `/outlets/${outlet.id}/assignments/${item.id}`;

        expect((await put(path, { isAvailable: true })).status).toBe(400);
        expect((await put(path, { priceOverrideCents: -5, isAvailable: true })).status).toBe(400);
        expect((await assign(outlet.id, randomUUID())).status).toBe(404);
        expect((await assign(randomUUID(), item.id)).status).toBe(404);
        expect((await get(`/outlets/${randomUUID()}/menu`)).status).toBe(404);
        expect(await countRows("outlet_menu_items")).toBe(0);
    });

    it("shows an outlet only what it can sell", async () => {
        const outlet = await createOutlet();
        const other = await createOutlet({ code: "GUL", name: "Gulshan" });
        const sold = await createItem();
        const offHere = await createItem({ sku: "DR-001", name: "Lemonade" });
        const offAtHeadOffice = await createItem({ sku: "SD-001", name: "Fries" });
        const elsewhere = await createItem({ sku: "PZ-001", name: "Pizza" });
        await createItem({ sku: "NA-001", name: "Never assigned" });
        await assign(outlet.id, sold.id);
        await assign(outlet.id, offHere.id, { isAvailable: false });
        await assign(outlet.id, offAtHeadOffice.id);
        await assign(other.id, elsewhere.id);
        await patch(`/menu-items/${offAtHeadOffice.id}`, { isActive: false });

        const menu = await get(`/outlets/${outlet.id}/menu`);
        const assigned = await get(`/outlets/${outlet.id}/assignments`);
        const searched = await get(`/outlets/${outlet.id}/menu?search=bg-0`);

        expect(menu.body.response.data.map((line: { sku: string }) => line.sku)).toEqual(["BG-001"]);
        expect(menu.body.response).toMatchObject({ total: 1, limit: 100 });
        expect(menu.body.response.data[0]).toMatchObject({ stock: 0, outOfStock: true });
        expect(searched.body.response.total).toBe(1);
        // Head office still sees everything assigned to this outlet
        expect(assigned.body.response.total).toBe(3);

        await setStock(3);
        const restocked = await get(`/outlets/${outlet.id}/menu`);
        expect(restocked.body.response.data[0]).toMatchObject({ stock: 3, outOfStock: false });
    });
});

describe("what the client may see", () => {
    it("never sends a database id", async () => {
        const outlet = await createOutlet();
        const item = await createItem();
        const saved = await assign(outlet.id, item.id);

        const answers = await Promise.all([
            get("/outlets"),
            get(`/outlets/${outlet.id}`),
            get("/menu-items"),
            get(`/menu-items/${item.id}`),
            get(`/outlets/${outlet.id}/assignments`),
            get(`/outlets/${outlet.id}/menu`),
        ]);

        [outlet, item, saved.body, ...answers.map((res) => res.body)].forEach(expectNoInternalIds);
    });

    it("shows the display settings", async () => {
        const res = await get("/app-config");

        expect(res.status).toBe(200);
        expect(Object.keys(res.body.response).sort()).toEqual([
            "companyName",
            "companyTaxNo",
            "currency",
            "timezone",
            "vatBps",
        ]);
    });
});
