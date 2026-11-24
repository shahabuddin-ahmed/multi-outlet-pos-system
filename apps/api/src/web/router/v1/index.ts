import { Router } from "express";
import { ERROR_CODES } from "../../../constant/error";
import { PostControllerInterface } from "../../controller/v1/post";
import { NotFoundException } from "../../exception/not-found-exception";
import { newHealthRouter } from "./health";
import { newPostRouter } from "./post";

export interface V1Controllers {
    postController: PostControllerInterface;
}

export const newV1Router = async ({ postController }: V1Controllers): Promise<Router> => {
    const v1 = Router();
    v1.use("/health", await newHealthRouter());
    v1.use("/posts", await newPostRouter(postController));

    v1.use("*", (req) => {
        throw new NotFoundException(ERROR_CODES.E_PAGE_NOT_FOUND, "", [`Cannot ${req.method} ${req.baseUrl}`]);
    });

    return v1;
};
