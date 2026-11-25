import { Router } from "express";
import { AppConfigControllerInterface } from "../../controller/v1/app-config";
import { asyncHandler } from "../../middleware/async-handler";

export const newAppConfigRouter = async (appConfigController: AppConfigControllerInterface): Promise<Router> => {
    const router = Router();

    router.get("/", asyncHandler(appConfigController.get));

    return router;
};
