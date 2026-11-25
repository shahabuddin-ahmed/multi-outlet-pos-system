import { Router } from "express";
import { InventoryControllerInterface } from "../../controller/v1/inventory";
import { asyncHandler } from "../../middleware/async-handler";
import { managementAtOutlet } from "../../middleware/authorize";

// Mounted under /outlets/:outletId, so it needs the parent's route parameter
export const newInventoryRouter = async (inventoryController: InventoryControllerInterface): Promise<Router> => {
    const router = Router({ mergeParams: true });

    router.get("/inventory", managementAtOutlet, asyncHandler(inventoryController.list));
    router.get("/inventory/:menuItemId/movements", managementAtOutlet, asyncHandler(inventoryController.history));
    router.post("/inventory/:menuItemId/adjustments", managementAtOutlet, asyncHandler(inventoryController.adjust));

    return router;
};
