import { Router } from "express";
import { MenuItemControllerInterface } from "../../controller/v1/menu-item";
import { asyncHandler } from "../../middleware/async-handler";

export const newMenuItemRouter = async (menuItemController: MenuItemControllerInterface): Promise<Router> => {
    const router = Router();

    router.post("/", asyncHandler(menuItemController.create));
    router.get("/", asyncHandler(menuItemController.list));
    router.get("/:menuItemId", asyncHandler(menuItemController.getById));
    router.patch("/:menuItemId", asyncHandler(menuItemController.update));

    return router;
};
