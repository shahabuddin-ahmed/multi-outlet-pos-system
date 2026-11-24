import cors from "cors";
import { RequestHandler } from "express";
import helmet from "helmet";
import { CORS_MAX_AGE_SECONDS, CORS_METHODS, REQUEST_ID_HEADER } from "../../constant/api";

export const securityHeaders: RequestHandler = helmet();

export const newCors = (allowedOrigins: string[]): RequestHandler =>
    cors({
        origin: allowedOrigins,
        methods: CORS_METHODS,
        exposedHeaders: [REQUEST_ID_HEADER],
        maxAge: CORS_MAX_AGE_SECONDS,
    });
