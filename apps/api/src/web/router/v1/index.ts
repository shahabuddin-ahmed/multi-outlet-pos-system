import { Router } from "express";
import { ERROR_CODES } from "../../../constant/error";
import { AppConfigControllerInterface } from "../../controller/v1/app-config";
import { AssignmentControllerInterface } from "../../controller/v1/assignment";
import { MenuItemControllerInterface } from "../../controller/v1/menu-item";
import { OutletControllerInterface } from "../../controller/v1/outlet";
import { NotFoundException } from "../../exception/not-found-exception";
import { newAppConfigRouter } from "./app-config";
import { newAssignmentRouter } from "./assignment";
import { newHealthRouter } from "./health";
import { newMenuItemRouter } from "./menu-item";
import { newOutletRouter } from "./outlet";

export interface V1Controllers {
    appConfigController: AppConfigControllerInterface;
    outletController: OutletControllerInterface;
    menuItemController: MenuItemControllerInterface;
    assignmentController: AssignmentControllerInterface;
}

export const newV1Router = async ({
    appConfigController,
    outletController,
    menuItemController,
    assignmentController,
}: V1Controllers): Promise<Router> => {
    const v1 = Router();
    v1.use("/health", await newHealthRouter());
    v1.use("/app-config", await newAppConfigRouter(appConfigController));
    v1.use("/outlets", await newOutletRouter(outletController));
    v1.use("/outlets/:outletId", await newAssignmentRouter(assignmentController));
    v1.use("/menu-items", await newMenuItemRouter(menuItemController));

    v1.use("*", (req) => {
        throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "", [`Cannot ${req.method} ${req.baseUrl}`]);
    });

    return v1;
};
