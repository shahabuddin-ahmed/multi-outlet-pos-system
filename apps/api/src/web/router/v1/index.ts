import { RequestHandler, Router } from "express";
import { ERROR_CODES } from "../../../constant/error";
import { AppConfigControllerInterface } from "../../controller/v1/app-config";
import { AssignmentControllerInterface } from "../../controller/v1/assignment";
import { AuthControllerInterface } from "../../controller/v1/auth";
import { InventoryControllerInterface } from "../../controller/v1/inventory";
import { MenuItemControllerInterface } from "../../controller/v1/menu-item";
import { OutletControllerInterface } from "../../controller/v1/outlet";
import { ReportControllerInterface } from "../../controller/v1/report";
import { NotFoundException } from "../../exception/not-found-exception";
import { newAppConfigRouter } from "./app-config";
import { newAssignmentRouter } from "./assignment";
import { newAuthRouter } from "./auth";
import { newHealthRouter } from "./health";
import { newInventoryRouter } from "./inventory";
import { newMenuItemRouter } from "./menu-item";
import { newOutletRouter } from "./outlet";
import { newReportRouter } from "./report";

export interface V1Dependencies {
    authenticate: RequestHandler;
    loginRateLimit: RequestHandler;
    appConfigController: AppConfigControllerInterface;
    authController: AuthControllerInterface;
    outletController: OutletControllerInterface;
    menuItemController: MenuItemControllerInterface;
    assignmentController: AssignmentControllerInterface;
    inventoryController: InventoryControllerInterface;
    reportController: ReportControllerInterface;
}

export const newV1Router = async ({
    authenticate,
    loginRateLimit,
    appConfigController,
    authController,
    outletController,
    menuItemController,
    assignmentController,
    inventoryController,
    reportController,
}: V1Dependencies): Promise<Router> => {
    const v1 = Router();

    // Open to everyone
    v1.use("/health", await newHealthRouter());
    v1.use("/app-config", await newAppConfigRouter(appConfigController));
    v1.use("/auth", await newAuthRouter(authController, authenticate, loginRateLimit));

    // Everything below needs a signed-in user, and each route says who may use it
    v1.use(authenticate);
    v1.use("/outlets", await newOutletRouter(outletController));
    v1.use("/outlets/:outletId", await newAssignmentRouter(assignmentController));
    v1.use("/outlets/:outletId", await newInventoryRouter(inventoryController));
    v1.use("/menu-items", await newMenuItemRouter(menuItemController));
    v1.use("/reports", await newReportRouter(reportController));

    v1.use("*", (req) => {
        throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "", [`Cannot ${req.method} ${req.baseUrl}`]);
    });

    return v1;
};
