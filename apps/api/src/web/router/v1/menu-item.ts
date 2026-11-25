import { Router } from "express";
import { MenuItemControllerInterface } from "../../controller/v1/menu-item";
import { asyncHandler } from "../../middleware/async-handler";
import { headOfficeOnly } from "../../middleware/authorize";

export const newMenuItemRouter = async (menuItemController: MenuItemControllerInterface): Promise<Router> => {
    const router = Router();

    // The master menu belongs to head office
    router.use(headOfficeOnly);
    router.post("/", asyncHandler(menuItemController.create));
    router.get("/", asyncHandler(menuItemController.list));
    router.get("/:menuItemId", asyncHandler(menuItemController.getById));
    router.patch("/:menuItemId", asyncHandler(menuItemController.update));

    return router;
};
