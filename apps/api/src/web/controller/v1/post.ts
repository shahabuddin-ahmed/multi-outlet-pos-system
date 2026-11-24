import { Request, Response } from "express";
import Joi from "joi";
import { HttpStatus } from "../../../constant/http";
import { POST_LIMITS } from "../../../constant/post";
import { PostServiceInterface } from "../../../service/post";
import { Controller } from "../controller";
import { idParamsSchema, listQuerySchema } from "./common-schema";

export interface PostControllerInterface {
    create(req: Request, res: Response): Promise<any>;
    list(req: Request, res: Response): Promise<any>;
    getById(req: Request, res: Response): Promise<any>;
    update(req: Request, res: Response): Promise<any>;
    remove(req: Request, res: Response): Promise<any>;
}

const postFields = {
    title: Joi.string().trim().min(1).max(POST_LIMITS.TITLE_MAX),
    content: Joi.string().trim().min(1),
    author: Joi.string().trim().min(1).max(POST_LIMITS.AUTHOR_MAX),
    tags: Joi.array().items(Joi.string().trim().min(1).max(POST_LIMITS.TAG_MAX)).max(POST_LIMITS.TAGS_MAX),
    published: Joi.boolean(),
};

const createSchema = Joi.object({
    ...postFields,
    title: postFields.title.required(),
    content: postFields.content.required(),
});

const updateSchema = Joi.object(postFields).min(1);

export class PostController extends Controller implements PostControllerInterface {
    constructor(private postService: PostServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async create(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(createSchema, req.body);
        const data = await this.postService.create(value);
        return this.sendResponse({ response: data }, HttpStatus.CREATED, res);
    }

    async list(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(listQuerySchema, req.query);
        const data = await this.postService.list(value.offset, value.limit);
        return this.sendResponse({ response: data }, HttpStatus.OK, res);
    }

    async getById(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(idParamsSchema, req.params);
        const data = await this.postService.getById(value.id);
        return this.sendResponse({ response: data }, HttpStatus.OK, res);
    }

    async update(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(idParamsSchema, req.params);
        const { value: body } = await this.validateRequest(updateSchema, req.body);
        const data = await this.postService.update(params.id, body);
        return this.sendResponse({ response: data }, HttpStatus.OK, res);
    }

    async remove(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(idParamsSchema, req.params);
        await this.postService.remove(value.id);
        return this.sendResponse({ response: { deleted: true } }, HttpStatus.OK, res);
    }
}

export const newPostV1Controller = async (postService: PostServiceInterface): Promise<PostController> => {
    return new PostController(postService);
};
