import { Request, Response } from "express";
import Joi from "joi";
import { MANUAL_STOCK_REASONS, STOCK_MAX, STOCK_NOTE_MAX } from "../../../constant/stock";
import { HttpStatus } from "../../../constant/http";
import { InventoryServiceInterface } from "../../../service/inventory";
import { blankToNull } from "../../../utils/utility";
import { toStockDto, toStockMovementDto } from "../../dto/inventory";
import { toPageDto } from "../../dto/page";
import { currentUser } from "../../middleware/authenticate";
import { Controller } from "../controller";
import {
    idempotencyHeaderSchema,
    idempotencyInputOf,
    listQuerySchema,
    optionalText,
    outletItemParamsSchema,
    outletParamsSchema,
    pageQuerySchema,
} from "./common-schema";

export interface InventoryControllerInterface {
    list(req: Request, res: Response): Promise<any>;
    history(req: Request, res: Response): Promise<any>;
    adjust(req: Request, res: Response): Promise<any>;
}

const adjustSchema = Joi.object({
    delta: Joi.number().strict().integer().min(-STOCK_MAX).max(STOCK_MAX).invalid(0).required(),
    reason: Joi.string()
        .valid(...MANUAL_STOCK_REASONS)
        .required(),
    note: optionalText(STOCK_NOTE_MAX).default(null),
});

export class InventoryController extends Controller implements InventoryControllerInterface {
    constructor(private inventoryService: InventoryServiceInterface) {
        super();
        this.list = this.list.bind(this);
        this.history = this.history.bind(this);
        this.adjust = this.adjust.bind(this);
    }

    async list(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletParamsSchema, req.params);
        const { value: query } = await this.validateRequest(listQuerySchema, req.query);
        const page = await this.inventoryService.list(params.outletId, query);
        return this.sendResponse({ response: toPageDto(page, toStockDto) }, HttpStatus.OK, res);
    }

    async history(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletItemParamsSchema, req.params);
        const { value: query } = await this.validateRequest(pageQuerySchema, req.query);
        const page = await this.inventoryService.history(params.outletId, params.menuItemId, query);
        return this.sendResponse({ response: toPageDto(page, toStockMovementDto) }, HttpStatus.OK, res);
    }

    // 201 for a new change, 200 when the same request had already been completed
    async adjust(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletItemParamsSchema, req.params);
        const { value: headers } = await this.validateRequest(idempotencyHeaderSchema, idempotencyInputOf(req));
        const { value: body } = await this.validateRequest(adjustSchema, req.body);
        const { movement, replayed } = await this.inventoryService.adjust(
            params.outletId,
            params.menuItemId,
            blankToNull(body),
            headers.idempotencyKey,
            currentUser(res).id
        );
        const status = replayed ? HttpStatus.OK : HttpStatus.CREATED;
        return this.sendResponse({ response: toStockMovementDto(movement) }, status, res);
    }
}

export const newInventoryV1Controller = async (
    inventoryService: InventoryServiceInterface
): Promise<InventoryController> => {
    return new InventoryController(inventoryService);
};
