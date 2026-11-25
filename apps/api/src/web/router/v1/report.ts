import { Router } from "express";
import { ReportControllerInterface } from "../../controller/v1/report";
import { asyncHandler } from "../../middleware/async-handler";
import { headOfficeOnly } from "../../middleware/authorize";

export const newReportRouter = async (reportController: ReportControllerInterface): Promise<Router> => {
    const router = Router();

    // Reports compare outlets, so they are for head office
    router.use(headOfficeOnly);
    router.get("/revenue-by-outlet", asyncHandler(reportController.revenueByOutlet));
    router.get("/top-items", asyncHandler(reportController.topItems));
    router.get("/low-stock", asyncHandler(reportController.lowStock));

    return router;
};
