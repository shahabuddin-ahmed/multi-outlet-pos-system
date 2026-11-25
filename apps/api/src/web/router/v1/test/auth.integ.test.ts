import { randomUUID } from "crypto";
import { Express } from "express";
import jwt from "jsonwebtoken";
import { QueryTypes } from "sequelize";
import request from "supertest";
import config from "../../../../config/config";
import { API_PREFIX, UUID_PATTERN } from "../../../../constant/api";
import { UserRole } from "../../../../constant/auth";
import newSequelize from "../../../../infra/sequelize";
import { resetTestData } from "../../../../infra/test/test-database";
import { OutletRepo } from "../../../../repo/outlet";
import { OutletService } from "../../../../service/outlet";
import { startTestApp } from "./test-app";
import { logIn, signInAs, staffService, TEST_PASSWORD } from "./test-auth";

const outletService = new OutletService(new OutletRepo());
const newOutlet = (code: string) =>
    outletService.create({ code, name: `Outlet ${code}`, address: null, phone: null, isActive: true });

let app: Express;
let ownOutlet: string;
let otherOutlet: string;

beforeAll(async () => {
    app = await startTestApp();
});

beforeEach(async () => {
    await resetTestData();
    ownOutlet = (await newOutlet("DHK")).publicId;
    otherOutlet = (await newOutlet("GUL")).publicId;
});

afterAll(async () => {
    await newSequelize().close();
});

type Method = "get" | "post" | "put" | "patch";

const call = (method: Method, path: string, token?: string) => {
    const pending = request(app)[method](`${API_PREFIX}${path}`);
    return token ? pending.set("Authorization", `Bearer ${token}`) : pending;
};

describe("login", () => {
    it("signs in and answers without the password hash or a database id", async () => {
        await signInAs(app, UserRole.CASHIER, "DHK");

        const res = await logIn(app, "CASHIER.DHK@pos.test");

        expect(res.status).toBe(200);
        expect(res.body.response.user).toEqual({
            id: expect.stringMatching(UUID_PATTERN),
            email: "cashier.dhk@pos.test",
            fullName: "Test User",
            role: "CASHIER",
            outlet: { id: ownOutlet, code: "DHK", name: "Outlet DHK" },
        });
        expect((await call("get", "/auth/me", res.body.response.token)).body.response).toEqual(res.body.response.user);
    });

    it("gives one answer for a wrong password, an unknown email and a switched-off user", async () => {
        const { email } = await signInAs(app, UserRole.CASHIER, "DHK");

        const wrongPassword = await logIn(app, email, "wrong-password");
        const unknownEmail = await logIn(app, "nobody@pos.test");
        await staffService.deactivate(email);
        const switchedOff = await logIn(app, email);

        for (const res of [wrongPassword, unknownEmail, switchedOff]) {
            expect(res.status).toBe(401);
            expect(res.body.code).toBe("E_INVALID_CREDENTIALS");
        }
    });
});

describe("every request", () => {
    it("needs a token that we signed and that has not expired", async () => {
        const expired = jwt.sign({}, config.AUTH.JWT_SECRET, { subject: randomUUID(), expiresIn: -10 });
        const forged = jwt.sign({}, "another-secret-another-secret-another", { subject: randomUUID() });

        for (const token of [undefined, "not-a-token", expired, forged]) {
            const res = await call("get", "/outlets", token);
            expect(res.status).toBe(401);
            expect(res.body.code).toBe("E_UNAUTHENTICATED");
        }
    });

    it("stops a switched-off user at once, with the token they already have", async () => {
        const { email, token } = await signInAs(app, UserRole.OUTLET_MANAGER, "DHK");
        expect((await call("get", "/auth/me", token)).status).toBe(200);

        await staffService.deactivate(email);

        expect((await call("get", "/auth/me", token)).status).toBe(401);
    });

    it("ends earlier logins when the password changes", async () => {
        const { email, token } = await signInAs(app, UserRole.CASHIER, "DHK");

        await staffService.setPassword(email, "a-new-password");
        const old = await call("get", "/auth/me", token);
        const fresh = (await logIn(app, email, "a-new-password")).body.response.token;

        expect([old.status, old.body.code]).toEqual([401, "E_UNAUTHENTICATED"]);
        expect((await call("get", "/auth/me", fresh)).status).toBe(200);
    });

    it("stops the staff of a switched-off outlet", async () => {
        const { email, token } = await signInAs(app, UserRole.CASHIER, "DHK");

        await outletService.update(ownOutlet, { isActive: false });
        const menu = await call("get", `/outlets/${ownOutlet}/menu`, token);
        const again = await logIn(app, email);

        expect([menu.status, again.status]).toEqual([403, 403]);
        expect(menu.body.code).toBe("E_OUTLET_INACTIVE");
    });
});

describe("who may do what", () => {
    it("keeps head office work away from managers and cashiers", async () => {
        const staff = [
            await signInAs(app, UserRole.OUTLET_MANAGER, "DHK"),
            await signInAs(app, UserRole.CASHIER, "DHK"),
        ];
        const headOfficeRoutes: [Method, string][] = [
            ["get", "/outlets"],
            ["post", "/outlets"],
            ["patch", `/outlets/${ownOutlet}`],
            ["get", "/menu-items"],
            ["post", "/menu-items"],
            ["patch", `/menu-items/${randomUUID()}`],
            ["get", `/outlets/${ownOutlet}/assignments`],
            ["put", `/outlets/${ownOutlet}/assignments/${randomUUID()}`],
        ];

        for (const { token } of staff) {
            for (const [method, path] of headOfficeRoutes) {
                const res = await call(method, path, token);
                expect([method, path, res.status]).toEqual([method, path, 403]);
            }
        }
    });

    it("lets staff open their own outlet only, and head office every outlet", async () => {
        const cashier = await signInAs(app, UserRole.CASHIER, "DHK");
        const headOffice = await signInAs(app, UserRole.HQ_ADMIN);

        for (const path of ["", "/menu"]) {
            expect((await call("get", `/outlets/${ownOutlet}${path}`, cashier.token)).status).toBe(200);
            expect((await call("get", `/outlets/${otherOutlet}${path}`, cashier.token)).status).toBe(403);
            expect((await call("get", `/outlets/${ownOutlet}${path}`, headOffice.token)).status).toBe(200);
            expect((await call("get", `/outlets/${otherOutlet}${path}`, headOffice.token)).status).toBe(200);
        }
    });

    it("leaves the health check and the display settings open", async () => {
        expect((await call("get", "/health")).status).toBe(200);
        expect((await call("get", "/app-config")).status).toBe(200);
    });
});

describe("staff accounts", () => {
    const account = { email: "staff@pos.test", fullName: "Staff", password: TEST_PASSWORD };

    it("needs an outlet for staff, none for head office, and a new email", async () => {
        await expect(staffService.create({ ...account, role: UserRole.CASHIER })).rejects.toThrow("needs an outlet");
        await expect(staffService.create({ ...account, role: UserRole.HQ_ADMIN, outletCode: "DHK" })).rejects.toThrow(
            "does not belong"
        );

        await staffService.create({ ...account, role: UserRole.HQ_ADMIN });
        await expect(
            staffService.create({ ...account, email: "STAFF@pos.test", role: UserRole.HQ_ADMIN })
        ).rejects.toThrow("already exists");
    });

    it("keeps the outlet rule in the database too", async () => {
        await expect(
            newSequelize().query(
                `INSERT INTO users (email, password_hash, full_name, role)
                 VALUES ('raw@pos.test', 'x', 'Raw', 'CASHIER')`
            )
        ).rejects.toMatchObject({ name: "SequelizeDatabaseError" });
    });

    it("makes a password when none is given, stores only a hash and can change it", async () => {
        const email = "hq@pos.test";
        const { generatedPassword } = await staffService.create({ email, fullName: "HQ", role: UserRole.HQ_ADMIN });
        const stored = await newSequelize().query<{ passwordHash: string }>(
            `SELECT password_hash AS "passwordHash" FROM users`,
            { type: QueryTypes.SELECT }
        );

        expect(stored[0].passwordHash).toMatch(/^scrypt\$/);
        expect(stored[0].passwordHash).not.toContain(generatedPassword);
        expect((await logIn(app, email, generatedPassword!)).status).toBe(200);

        await staffService.setPassword(email, "a-new-password");

        expect((await logIn(app, email, generatedPassword!)).status).toBe(401);
        expect((await logIn(app, email, "a-new-password")).status).toBe(200);
    });
});
