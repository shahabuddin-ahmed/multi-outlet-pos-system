import { RequestHandler } from "express";
import { UserRole } from "../../constant/auth";
import { ERROR_CODES } from "../../constant/error";
import { ForbiddenException } from "../exception/forbidden-exception";
import { currentUser } from "./authenticate";

const passIf = (allowed: boolean) => (allowed ? undefined : new ForbiddenException(ERROR_CODES.E_FORBIDDEN));

// For routes that belong to no outlet
export const allowRoles =
    (...roles: UserRole[]): RequestHandler =>
    (_req, res, next) => {
        next(passIf(roles.includes(currentUser(res).role)));
    };

// For routes under /outlets/:outletId. Head office may open any outlet, staff only their own.
export const allowAtOutlet =
    (...roles: UserRole[]): RequestHandler =>
    (req, res, next) => {
        const { role, outlet } = currentUser(res);
        const ownOutlet = outlet?.publicId === String(req.params.outletId).toLowerCase();
        next(passIf(roles.includes(role) && (role === UserRole.HQ_ADMIN || ownOutlet)));
    };

export const headOfficeOnly = allowRoles(UserRole.HQ_ADMIN);
export const anyoneAtOutlet = allowAtOutlet(...Object.values(UserRole));
