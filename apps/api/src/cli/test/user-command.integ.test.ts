import { Express } from "express";
import request from "supertest";
import { API_PREFIX } from "../../constant/api";
import newSequelize from "../../infra/sequelize";
import { resetTestData } from "../../infra/test/test-database";
import { startTestApp } from "../../web/router/v1/test/test-app";
import { logIn, staffService } from "../../web/router/v1/test/test-auth";
import { newOutlet } from "../../web/router/v1/test/test-fixtures";
import { readUserCommand, runUserCommand } from "../user-command";

let app: Express;

beforeAll(async () => {
    app = await startTestApp();
});

beforeEach(async () => {
    await resetTestData();
    await newOutlet("DHK");
});

afterAll(async () => {
    await newSequelize().close();
});

const run = (line: string) => runUserCommand(readUserCommand(line.split(" ")), staffService);

const passwordIn = (lines: string[]): string => lines[1].split(": ")[1];

describe("the staff command", () => {
    it("creates, changes and switches off an account", async () => {
        const email = "manager@pos.test";

        const created = await run(
            `create --email Manager@POS.test --name Rahim --role OUTLET_MANAGER --outlet-code dhk`
        );
        const first = await logIn(app, email, passwordIn(created));
        const changed = await run(`set-password --email ${email} --password another-password-1`);
        const oldToken = await request(app)
            .get(`${API_PREFIX}/auth/me`)
            .set("Authorization", `Bearer ${first.body.response.token}`);
        const second = await logIn(app, email, "another-password-1");
        await run(`deactivate --email ${email}`);
        const after = await logIn(app, email, "another-password-1");

        expect(created[0]).toBe(`Created OUTLET_MANAGER ${email}`);
        expect(first.body.response.user).toMatchObject({ fullName: "Rahim", outlet: { code: "DHK" } });
        // A password given by the person is never printed back
        expect(changed).toHaveLength(1);
        expect([oldToken.status, second.status, after.status]).toEqual([401, 200, 401]);
    });

    it("refuses wrong input and says why", async () => {
        const refused: [string, string][] = [
            ["remove --email a@pos.test", "Unknown command"],
            ["create --email a@pos.test", '"name" is required'],
            ["create --email not-an-email --name A --role HQ_ADMIN", "valid email"],
            ["create --email a@pos.test --name A --role OWNER", '"role" must be one of'],
            ["set-password --email a@pos.test --password short", "at least 8"],
            ["deactivate --email a@pos.test --force", "Unknown option"],
        ];

        for (const [line, reason] of refused) {
            expect(() => readUserCommand(line.split(" "))).toThrow(reason);
        }
        await expect(run("deactivate --email nobody@pos.test")).rejects.toThrow("User not found");
        await expect(run("create --email a@pos.test --name A --role CASHIER --outlet-code XXX")).rejects.toThrow(
            "Outlet not found"
        );
    });
});
