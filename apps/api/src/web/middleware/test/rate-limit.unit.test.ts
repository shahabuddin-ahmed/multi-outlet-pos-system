import express, { RequestHandler } from "express";
import request from "supertest";
import { AuthControllerInterface } from "../../controller/v1/auth";
import { newAuthRouter } from "../../router/v1/auth";
import { newRateLimit } from "../rate-limit";

const ok: RequestHandler = (_req, res) => {
    res.send({});
};

describe("login attempts", () => {
    it("are limited per address", async () => {
        const controller = { login: ok, me: ok } as unknown as AuthControllerInterface;
        const passThrough: RequestHandler = (_req, _res, next) => next();
        const app = express().use("/auth", await newAuthRouter(controller, passThrough, newRateLimit(2)));

        const attempts = [];
        for (let attempt = 0; attempt < 3; attempt++) {
            attempts.push(await request(app).post("/auth/login"));
        }

        expect(attempts.map((res) => res.status)).toEqual([200, 200, 429]);
        expect(attempts[2].body.code).toBe("E_TOO_MANY_REQUESTS");
    });
});
