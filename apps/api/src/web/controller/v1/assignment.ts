import { Request, Response } from "express";
import Joi from "joi";
import { PRICE_MAX_CENTS } from "../../../constant/catalog";
import { HttpStatus } from "../../../constant/http";
import { AssignmentServiceInterface } from "../../../service/assignment";
import { toAssignmentDto, toOutletMenuItemDto } from "../../dto/assignment";
import { toPageDto } from "../../dto/page";
import { Controller } from "../controller";
import {
    listQuerySchema,
    menuQuerySchema,
    outletItemParamsSchema,
    outletParamsSchema,
    priceCentsSchema,
} from "./common-schema";

export interface AssignmentControllerInterface {
    save(req: Request, res: Response): Promise<any>;
    list(req: Request, res: Response): Promise<any>;
    menu(req: Request, res: Response): Promise<any>;
}

// PUT replaces the whole assignment, so both fields are required. null removes the outlet price.
const saveSchema = Joi.object({
    priceOverrideCents: priceCentsSchema(PRICE_MAX_CENTS).allow(null).required(),
    isAvailable: Joi.boolean().required(),
});

export class AssignmentController extends Controller implements AssignmentControllerInterface {
    constructor(private assignmentService: AssignmentServiceInterface) {
        super();
        this.save = this.save.bind(this);
        this.list = this.list.bind(this);
        this.menu = this.menu.bind(this);
    }

    async save(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletItemParamsSchema, req.params);
        const { value: body } = await this.validateRequest(saveSchema, req.body);
        const { assignment, created } = await this.assignmentService.save(params.outletId, params.menuItemId, body);
        return this.sendResponse(
            { response: toAssignmentDto(assignment) },
            created ? HttpStatus.CREATED : HttpStatus.OK,
            res
        );
    }

    async list(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletParamsSchema, req.params);
        const { value: query } = await this.validateRequest(listQuerySchema, req.query);
        const page = await this.assignmentService.list(params.outletId, query);
        return this.sendResponse({ response: toPageDto(page, toAssignmentDto) }, HttpStatus.OK, res);
    }

    async menu(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletParamsSchema, req.params);
        const { value: query } = await this.validateRequest(menuQuerySchema, req.query);
        const page = await this.assignmentService.listMenu(params.outletId, query);
        return this.sendResponse({ response: toPageDto(page, toOutletMenuItemDto) }, HttpStatus.OK, res);
    }
}

export const newAssignmentV1Controller = async (
    assignmentService: AssignmentServiceInterface
): Promise<AssignmentController> => {
    return new AssignmentController(assignmentService);
};
