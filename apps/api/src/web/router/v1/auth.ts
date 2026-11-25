import { RequestHandler, Router } from "express";
import { AuthControllerInterface } from "../../controller/v1/auth";
import { asyncHandler } from "../../middleware/async-handler";
import { requireOpenOutlet } from "../../middleware/authorize";

export const newAuthRouter = async (
    authController: AuthControllerInterface,
    authenticate: RequestHandler,
    loginRateLimit: RequestHandler
): Promise<Router> => {
    const router = Router();

    router.post("/login", loginRateLimit, asyncHandler(authController.login));
    router.get("/me", authenticate, requireOpenOutlet, asyncHandler(authController.me));

    return router;
};
