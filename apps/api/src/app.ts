import express from "express";
import bodyParser from "body-parser";
import config from "./config/config";
import { API_PREFIX, JSON_BODY_LIMIT } from "./constant/api";
import { ERROR_CODES } from "./constant/error";
import { initializeDBConnection } from "./infra/db";
import { newPostRepo } from "./repo/post";
import { newPostService } from "./service/post";
import { newPostV1Controller } from "./web/controller/v1/post";
import { NotFoundException } from "./web/exception/not-found-exception";
import { globalErrorHandler } from "./web/middleware/global-error-handler";
import { newRateLimit } from "./web/middleware/rate-limit";
import { requestId } from "./web/middleware/request-id";
import { requestLogger } from "./web/middleware/request-logger";
import { newCors, securityHeaders } from "./web/middleware/security";
import { newV1Router } from "./web/router/v1/index";

const app = express();

if (config.SECURITY.TRUST_PROXY > 0) {
    // Behind a load balancer: use the real client address for logs and rate limits
    app.set("trust proxy", config.SECURITY.TRUST_PROXY);
}

app.use(securityHeaders);
app.use(requestId);
app.use(requestLogger);
app.use(newCors(config.SECURITY.WEB_ORIGIN));
app.use(API_PREFIX, newRateLimit(config.SECURITY.RATE_LIMIT_PER_MINUTE));
app.use(bodyParser.json({ limit: JSON_BODY_LIMIT }));

export const appReady: Promise<void> = (async () => {
    await initializeDBConnection();

    // Initialize Repo
    const postRepo = await newPostRepo();

    // Initialize Service
    const postService = await newPostService(postRepo);

    // Initialize Controller
    const postV1Controller = await newPostV1Controller(postService);

    // Initialize Router
    const v1Router = await newV1Router({
        postController: postV1Controller,
    });

    app.use(API_PREFIX, v1Router);
    app.use((req) => {
        throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "", [`Cannot ${req.method} ${req.path}`]);
    });
    app.use(globalErrorHandler);
})();

export default app;
