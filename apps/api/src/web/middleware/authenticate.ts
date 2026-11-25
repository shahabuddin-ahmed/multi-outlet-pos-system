import { RequestHandler, Response } from "express";
import { BEARER_PREFIX } from "../../constant/auth";
import { ERROR_CODES } from "../../constant/error";
import { AuthServiceInterface, AuthUser } from "../../service/auth";
import { UnauthorizedException } from "../exception/unauthorized-exception";
import { asyncHandler } from "./async-handler";

// The user that newAuthenticate put on this request
export const currentUser = (res: Response): AuthUser => res.locals.user;

export const newAuthenticate = (authService: AuthServiceInterface): RequestHandler =>
    asyncHandler(async (req, res, next) => {
        const header = req.header("authorization") ?? "";
        if (!header.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedException(ERROR_CODES.E_UNAUTHENTICATED);
        }
        res.locals.user = await authService.authenticate(header.slice(BEARER_PREFIX.length));
        next();
    });
