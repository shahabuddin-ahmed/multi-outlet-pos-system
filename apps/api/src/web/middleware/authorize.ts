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

// Staff of a switched-off outlet may do nothing (except retry a sale; see the v1 router)
export const requireOpenOutlet: RequestHandler = (_req, res, next) => {
    const { outlet } = currentUser(res);
    next(outlet && !outlet.isActive ? new ForbiddenException(ERROR_CODES.E_OUTLET_INACTIVE) : undefined);
};

export const headOfficeOnly = allowRoles(UserRole.HQ_ADMIN);
// Selling is the outlet's work: head office does not ring up sales
export const staffAtOutlet = allowAtOutlet(UserRole.OUTLET_MANAGER, UserRole.CASHIER);
export const anyoneAtOutlet = allowAtOutlet(...Object.values(UserRole));
export const managementAtOutlet = allowAtOutlet(UserRole.HQ_ADMIN, UserRole.OUTLET_MANAGER);
