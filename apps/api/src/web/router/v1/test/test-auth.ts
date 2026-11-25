import { Express } from "express";
import request from "supertest";
import { API_PREFIX } from "../../../../constant/api";
import { UserRole } from "../../../../constant/auth";
import { OutletRepo } from "../../../../repo/outlet";
import { UserRepo } from "../../../../repo/user";
import { UserService } from "../../../../service/user";

export const TEST_PASSWORD = "test-password-123";

export const staffService = new UserService(new UserRepo(), new OutletRepo());

export const logIn = (app: Express, email: string, password: string = TEST_PASSWORD) =>
    request(app).post(`${API_PREFIX}/auth/login`).send({ email, password });

// Creates a user the way the staff command does, then signs in
export const signInAs = async (app: Express, role: UserRole, outletCode?: string) => {
    const email = `${role}.${outletCode ?? "hq"}@pos.test`.toLowerCase();
    await staffService.create({ email, fullName: "Test User", role, outletCode, password: TEST_PASSWORD });
    const res = await logIn(app, email);
    expect(res.status).toBe(200);
    return { email, token: res.body.response.token as string };
};
