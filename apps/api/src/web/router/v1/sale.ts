import { Router } from "express";
import { SaleControllerInterface } from "../../controller/v1/sale";
import { asyncHandler } from "../../middleware/async-handler";
import { anyoneAtOutlet, headOfficeOnly } from "../../middleware/authorize";

// Mounted under /outlets/:outletId. Which sales a user sees is decided by the service.
// Making a sale is registered in the v1 router.
export const newOutletSaleRouter = async (saleController: SaleControllerInterface): Promise<Router> => {
    const router = Router({ mergeParams: true });

    router.get("/sales", anyoneAtOutlet, asyncHandler(saleController.list));
    router.get("/sales/:saleId", anyoneAtOutlet, asyncHandler(saleController.getById));

    return router;
};

// Sales of all outlets in one list
export const newSaleRouter = async (saleController: SaleControllerInterface): Promise<Router> => {
    const router = Router();

    router.get("/", headOfficeOnly, asyncHandler(saleController.listAll));

    return router;
};
