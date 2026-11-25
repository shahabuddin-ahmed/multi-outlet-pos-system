import { Router } from "express";
import { OutletControllerInterface } from "../../controller/v1/outlet";
import { asyncHandler } from "../../middleware/async-handler";
import { anyoneAtOutlet, headOfficeOnly } from "../../middleware/authorize";

export const newOutletRouter = async (outletController: OutletControllerInterface): Promise<Router> => {
    const router = Router();

    router.post("/", headOfficeOnly, asyncHandler(outletController.create));
    router.get("/", headOfficeOnly, asyncHandler(outletController.list));
    router.get("/:outletId", anyoneAtOutlet, asyncHandler(outletController.getById));
    router.patch("/:outletId", headOfficeOnly, asyncHandler(outletController.update));

    return router;
};
