import { Request, Response, NextFunction } from "express";
import { PG_TIMEOUT_CODES } from "../../constant/database";
import { errorMessages, ERROR_CODES } from "../../constant/error";
import { NodeEnv } from "../../constant/env";
import { HttpStatus } from "../../constant/http";
import config from "../../config/config";
import logger from "../../infra/logger";
import { ResponseType } from "../controller/controller";
import { HttpException } from "../exception/http-exception";
import { pathOf } from "./request-logger";

interface KnownError {
    status: HttpStatus;
    code: ERROR_CODES;
}

interface ErrorDetails {
    code: string;
    message: string;
    errors: string[];
}

// Errors from body-parser, found by err.type
const BODY_ERRORS: Record<string, KnownError> = {
    "entity.parse.failed": { status: HttpStatus.BAD_REQUEST, code: ERROR_CODES.E_INVALID_DATA },
    "entity.too.large": { status: HttpStatus.PAYLOAD_TOO_LARGE, code: ERROR_CODES.E_PAYLOAD_TOO_LARGE },
};

const BUSY: KnownError = { status: HttpStatus.SERVICE_UNAVAILABLE, code: ERROR_CODES.E_SERVICE_UNAVAILABLE };

// Database errors the client can act on, found by err.name: a clash with existing data, or no free connection
const DATABASE_ERRORS: Record<string, KnownError> = {
    SequelizeUniqueConstraintError: { status: HttpStatus.CONFLICT, code: ERROR_CODES.E_CONFLICT },
    SequelizeConnectionAcquireTimeoutError: BUSY,
};

const knownErrorOf = (err: any): KnownError | undefined => {
    if (PG_TIMEOUT_CODES.includes(err.parent?.code)) {
        // The database cut off a long wait; trying again is safe
        return BUSY;
    }
    return BODY_ERRORS[err.type] ?? DATABASE_ERRORS[err.name];
};

const detailsOf = (err: any, knownError: KnownError | undefined, isServerError: boolean): ErrorDetails => {
    if (knownError) {
        // Fixed text only: database errors can contain row values
        const message = errorMessages[knownError.code].message;
        return { code: knownError.code, message, errors: [message] };
    }
    if (isServerError) {
        const message = errorMessages.E_INTERNAL_SERVER_ERROR.message;
        return { code: ERROR_CODES.E_INTERNAL_SERVER_ERROR, message, errors: [message] };
    }
    const message = err.message || errorMessages.E_INVALID_DATA.message;
    return { code: err.code ?? ERROR_CODES.E_INVALID_DATA, message, errors: err.errors || [message] };
};

export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    const knownError = knownErrorOf(err);
    const statusCode: number = knownError?.status ?? err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const isServerError = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;

    if (isServerError) {
        // No error message here: database errors can contain row values. The stack only in development.
        logger.error("unhandled error", {
            requestId: res.locals.requestId,
            method: req.method,
            path: pathOf(req),
            error: err.name ?? "Error",
            stack: config.NODE_ENV === NodeEnv.DEVELOPMENT ? err.stack : undefined,
        });
    }

    const { code, message, errors } = detailsOf(err, knownError, isServerError);
    // Only our own exceptions carry data for the client
    const response = !isServerError && err instanceof HttpException ? (err.details ?? null) : null;
    const body: ResponseType = { code, message, response, errors };
    return res.status(statusCode).send(body);
};
