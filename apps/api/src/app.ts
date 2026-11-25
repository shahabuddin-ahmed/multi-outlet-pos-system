import express from "express";
import bodyParser from "body-parser";
import config from "./config/config";
import { API_PREFIX, JSON_BODY_LIMIT } from "./constant/api";
import { ERROR_CODES } from "./constant/error";
import { initializeDBConnection } from "./infra/db";
import { newAssignmentRepo } from "./repo/assignment";
import { newInventoryRepo } from "./repo/inventory";
import { newMenuItemRepo } from "./repo/menu-item";
import { newOutletRepo } from "./repo/outlet";
import { newUserRepo } from "./repo/user";
import { newAssignmentService } from "./service/assignment";
import { newAuthService } from "./service/auth";
import { newInventoryService } from "./service/inventory";
import { newMenuItemService } from "./service/menu-item";
import { newOutletService } from "./service/outlet";
import { newAppConfigV1Controller } from "./web/controller/v1/app-config";
import { newAssignmentV1Controller } from "./web/controller/v1/assignment";
import { newAuthV1Controller } from "./web/controller/v1/auth";
import { newInventoryV1Controller } from "./web/controller/v1/inventory";
import { newMenuItemV1Controller } from "./web/controller/v1/menu-item";
import { newOutletV1Controller } from "./web/controller/v1/outlet";
import { newReportV1Controller } from "./web/controller/v1/report";
import { NotFoundException } from "./web/exception/not-found-exception";
import { newAuthenticate } from "./web/middleware/authenticate";
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
    const outletRepo = await newOutletRepo();
    const menuItemRepo = await newMenuItemRepo();
    const assignmentRepo = await newAssignmentRepo();
    const userRepo = await newUserRepo();
    const inventoryRepo = await newInventoryRepo();

    // Initialize Service
    const authService = await newAuthService(userRepo, config.AUTH);
    const outletService = await newOutletService(outletRepo);
    const menuItemService = await newMenuItemService(menuItemRepo);
    const assignmentService = await newAssignmentService(assignmentRepo, outletService, menuItemService);
    const inventoryService = await newInventoryService(inventoryRepo, outletService, menuItemService);

    // Initialize Controller
    const authV1Controller = await newAuthV1Controller(authService);
    const appConfigV1Controller = await newAppConfigV1Controller(config.BUSINESS);
    const outletV1Controller = await newOutletV1Controller(outletService);
    const menuItemV1Controller = await newMenuItemV1Controller(menuItemService);
    const assignmentV1Controller = await newAssignmentV1Controller(assignmentService);
    const inventoryV1Controller = await newInventoryV1Controller(inventoryService);
    const reportV1Controller = await newReportV1Controller(inventoryService);

    // Initialize Router
    const v1Router = await newV1Router({
        authenticate: newAuthenticate(authService),
        // Slows down password guessing, on top of the general limit
        loginRateLimit: newRateLimit(config.AUTH.LOGIN_RATE_LIMIT_PER_MINUTE),
        authController: authV1Controller,
        appConfigController: appConfigV1Controller,
        outletController: outletV1Controller,
        menuItemController: menuItemV1Controller,
        assignmentController: assignmentV1Controller,
        inventoryController: inventoryV1Controller,
        reportController: reportV1Controller,
    });

    app.use(API_PREFIX, v1Router);
    app.use((req) => {
        throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "", [`Cannot ${req.method} ${req.path}`]);
    });
    app.use(globalErrorHandler);
})();

export default app;
