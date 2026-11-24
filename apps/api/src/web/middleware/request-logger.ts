import { NextFunction, Request, Response } from "express";
import { NS_PER_MS } from "../../constant/api";
import logger from "../../infra/logger";

export const pathOf = (req: Request): string => req.originalUrl.split("?")[0];

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
        logger.info("request", {
            requestId: res.locals.requestId,
            method: req.method,
            path: pathOf(req),
            status: res.statusCode,
            ms: Math.round(Number(process.hrtime.bigint() - startedAt) / NS_PER_MS),
        });
    });
    next();
};
