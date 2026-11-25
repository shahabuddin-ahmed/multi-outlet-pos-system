import { Router } from "express";
import { OutletControllerInterface } from "../../controller/v1/outlet";
import { asyncHandler } from "../../middleware/async-handler";

export const newOutletRouter = async (outletController: OutletControllerInterface): Promise<Router> => {
    const router = Router();

    router.post("/", asyncHandler(outletController.create));
    router.get("/", asyncHandler(outletController.list));
    router.get("/:outletId", asyncHandler(outletController.getById));
    router.patch("/:outletId", asyncHandler(outletController.update));

    return router;
};
