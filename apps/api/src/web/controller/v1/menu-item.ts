import { Request, Response } from "express";
import Joi from "joi";
import { MENU_ITEM_LIMITS, PRICE_MAX_CENTS } from "../../../constant/catalog";
import { HttpStatus } from "../../../constant/http";
import { MenuItemServiceInterface } from "../../../service/menu-item";
import { toMenuItemDto } from "../../dto/menu-item";
import { toPageDto } from "../../dto/page";
import { Controller } from "../controller";
import { listQuerySchema, menuItemParamsSchema, priceCentsSchema } from "./common-schema";

export interface MenuItemControllerInterface {
    create(req: Request, res: Response): Promise<any>;
    list(req: Request, res: Response): Promise<any>;
    getById(req: Request, res: Response): Promise<any>;
    update(req: Request, res: Response): Promise<any>;
}

// The SKU is only in the create schema: it cannot be changed later
const changeableFields = {
    name: Joi.string().trim().min(1).max(MENU_ITEM_LIMITS.NAME_MAX),
    basePriceCents: priceCentsSchema(PRICE_MAX_CENTS),
    isActive: Joi.boolean(),
};

const createSchema = Joi.object({
    ...changeableFields,
    sku: Joi.string()
        .trim()
        .pattern(MENU_ITEM_LIMITS.SKU_PATTERN)
        .required()
        .messages({ "string.pattern.base": "{{#label}} must be 2 to 30 letters, digits or hyphens" }),
    name: changeableFields.name.required(),
    basePriceCents: changeableFields.basePriceCents.required(),
    isActive: changeableFields.isActive.default(true),
});

const updateSchema = Joi.object(changeableFields).min(1);

export class MenuItemController extends Controller implements MenuItemControllerInterface {
    constructor(private menuItemService: MenuItemServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
    }

    async create(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(createSchema, req.body);
        const item = await this.menuItemService.create(value);
        return this.sendResponse({ response: toMenuItemDto(item) }, HttpStatus.CREATED, res);
    }

    async list(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(listQuerySchema, req.query);
        const page = await this.menuItemService.list(value);
        return this.sendResponse({ response: toPageDto(page, toMenuItemDto) }, HttpStatus.OK, res);
    }

    async getById(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(menuItemParamsSchema, req.params);
        const item = await this.menuItemService.getByPublicId(value.menuItemId);
        return this.sendResponse({ response: toMenuItemDto(item) }, HttpStatus.OK, res);
    }

    async update(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(menuItemParamsSchema, req.params);
        const { value: body } = await this.validateRequest(updateSchema, req.body);
        const item = await this.menuItemService.update(params.menuItemId, body);
        return this.sendResponse({ response: toMenuItemDto(item) }, HttpStatus.OK, res);
    }
}

export const newMenuItemV1Controller = async (
    menuItemService: MenuItemServiceInterface
): Promise<MenuItemController> => {
    return new MenuItemController(menuItemService);
};
