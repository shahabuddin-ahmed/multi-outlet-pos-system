import { Request, Response } from "express";
import Joi from "joi";
import { OUTLET_LIMITS } from "../../../constant/catalog";
import { HttpStatus } from "../../../constant/http";
import { OutletServiceInterface } from "../../../service/outlet";
import { blankToNull } from "../../../utils/utility";
import { toOutletDto } from "../../dto/outlet";
import { toPageDto } from "../../dto/page";
import { Controller } from "../controller";
import { listQuerySchema, optionalText, outletParamsSchema } from "./common-schema";

export interface OutletControllerInterface {
    create(req: Request, res: Response): Promise<any>;
    list(req: Request, res: Response): Promise<any>;
    getById(req: Request, res: Response): Promise<any>;
    update(req: Request, res: Response): Promise<any>;
}

// The code is only in the create schema: it cannot be changed later
const changeableFields = {
    name: Joi.string().trim().min(1).max(OUTLET_LIMITS.NAME_MAX),
    address: optionalText(OUTLET_LIMITS.ADDRESS_MAX),
    phone: optionalText(OUTLET_LIMITS.PHONE_MAX),
    isActive: Joi.boolean(),
};

const createSchema = Joi.object({
    ...changeableFields,
    code: Joi.string()
        .trim()
        .pattern(OUTLET_LIMITS.CODE_PATTERN)
        .required()
        .messages({ "string.pattern.base": "{{#label}} must be 2 to 10 capital letters or digits" }),
    name: changeableFields.name.required(),
    address: changeableFields.address.default(null),
    phone: changeableFields.phone.default(null),
    isActive: changeableFields.isActive.default(true),
});

const updateSchema = Joi.object(changeableFields).min(1);

export class OutletController extends Controller implements OutletControllerInterface {
    constructor(private outletService: OutletServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
    }

    async create(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(createSchema, req.body);
        const outlet = await this.outletService.create(blankToNull(value));
        return this.sendResponse({ response: toOutletDto(outlet) }, HttpStatus.CREATED, res);
    }

    async list(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(listQuerySchema, req.query);
        const page = await this.outletService.list(value);
        return this.sendResponse({ response: toPageDto(page, toOutletDto) }, HttpStatus.OK, res);
    }

    async getById(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(outletParamsSchema, req.params);
        const outlet = await this.outletService.getByPublicId(value.outletId);
        return this.sendResponse({ response: toOutletDto(outlet) }, HttpStatus.OK, res);
    }

    async update(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletParamsSchema, req.params);
        const { value: body } = await this.validateRequest(updateSchema, req.body);
        const outlet = await this.outletService.update(params.outletId, blankToNull(body));
        return this.sendResponse({ response: toOutletDto(outlet) }, HttpStatus.OK, res);
    }
}

export const newOutletV1Controller = async (outletService: OutletServiceInterface): Promise<OutletController> => {
    return new OutletController(outletService);
};
