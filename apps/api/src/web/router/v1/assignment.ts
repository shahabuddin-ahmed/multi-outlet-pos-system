import { Router } from "express";
import { AssignmentControllerInterface } from "../../controller/v1/assignment";
import { asyncHandler } from "../../middleware/async-handler";
import { anyoneAtOutlet, headOfficeOnly } from "../../middleware/authorize";

// Mounted under /outlets/:outletId, so it needs the parent's route parameter
export const newAssignmentRouter = async (assignmentController: AssignmentControllerInterface): Promise<Router> => {
    const router = Router({ mergeParams: true });

    router.get("/assignments", headOfficeOnly, asyncHandler(assignmentController.list));
    router.put("/assignments/:menuItemId", headOfficeOnly, asyncHandler(assignmentController.save));
    router.get("/menu", anyoneAtOutlet, asyncHandler(assignmentController.menu));

    return router;
};
