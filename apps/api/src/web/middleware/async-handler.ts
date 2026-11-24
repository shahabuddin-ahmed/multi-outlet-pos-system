import { NextFunction, Request, RequestHandler, Response } from "express";

// Wraps an async controller method so a thrown error reaches the global error handler
export const asyncHandler = (fn: RequestHandler) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await fn(req, res, next);
    } catch (err) {
        next(err);
    }
};
