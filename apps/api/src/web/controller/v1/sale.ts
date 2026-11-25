import { Request, Response } from "express";
import Joi from "joi";
import { PAGINATION } from "../../../constant/api";
import { HttpStatus } from "../../../constant/http";
import {
    IDEMPOTENCY_HEADER,
    OrderType,
    PaymentMethod,
    RECEIPT_SEARCH_PATTERN,
    SALE_LIMITS,
} from "../../../constant/sale";
import { SaleServiceInterface } from "../../../service/sale";
import { blankToNull } from "../../../utils/utility";
import { toPageDto } from "../../dto/page";
import { toReceiptDto, toSaleSummaryDto } from "../../dto/sale";
import { currentUser } from "../../middleware/authenticate";
import { Controller } from "../controller";
import { calendarDateSchema, optionalText, outletParamsSchema, pageFields, publicIdSchema } from "./common-schema";

export interface SaleControllerInterface {
    create(req: Request, res: Response): Promise<any>;
    getById(req: Request, res: Response): Promise<any>;
    list(req: Request, res: Response): Promise<any>;
    listAll(req: Request, res: Response): Promise<any>;
}

// Money from the client is only ever compared with what the server works out
const amountSchema = Joi.number().strict().integer().min(0);

// No prices and no VAT here: unknown fields are refused, so a client cannot send them
const saleSchema = Joi.object({
    orderType: Joi.string()
        .valid(...Object.values(OrderType))
        .required(),
    tableLabel: optionalText(SALE_LIMITS.TABLE_MAX).default(null),
    payment: Joi.object({
        method: Joi.string()
            .valid(...Object.values(PaymentMethod))
            .required(),
        cashReceivedCents: amountSchema.allow(null).default(null),
        reference: optionalText(SALE_LIMITS.REFERENCE_MAX).default(null),
    }).required(),
    expectedTotalCents: amountSchema.required(),
    items: Joi.array()
        .items(
            Joi.object({
                menuItemId: publicIdSchema.required(),
                quantity: Joi.number().strict().integer().min(1).max(SALE_LIMITS.QUANTITY_MAX).required(),
            })
        )
        .min(1)
        .max(SALE_LIMITS.LINES_MAX)
        .required(),
});

const headerSchema = Joi.object({
    idempotencyKey: publicIdSchema.required().label(IDEMPOTENCY_HEADER),
});

const saleParamsSchema = Joi.object({
    outletId: publicIdSchema.required(),
    saleId: publicIdSchema.required(),
});

const historyFields = {
    receipt: Joi.string()
        .trim()
        .pattern(RECEIPT_SEARCH_PATTERN)
        .messages({ "string.pattern.base": "{{#label}} must look like DHK-000042 or 42" })
        .empty(""),
    from: calendarDateSchema,
    to: calendarDateSchema,
    ...pageFields(PAGINATION.DEFAULT_LIST_LIMIT),
};

const outletHistorySchema = Joi.object(historyFields);
const allHistorySchema = Joi.object({ ...historyFields, outletId: publicIdSchema });

export class SaleController extends Controller implements SaleControllerInterface {
    constructor(private saleService: SaleServiceInterface) {
        super();
        this.create = this.create.bind(this);
        this.getById = this.getById.bind(this);
        this.list = this.list.bind(this);
        this.listAll = this.listAll.bind(this);
    }

    // 201 for a new sale, 200 when the same request had already been completed
    async create(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletParamsSchema, req.params);
        const { value: headers } = await this.validateRequest(headerSchema, {
            idempotencyKey: req.header(IDEMPOTENCY_HEADER)?.toLowerCase(),
        });
        const { value: body } = await this.validateRequest(saleSchema, req.body);
        const { sale, replayed } = await this.saleService.create(
            params.outletId,
            { ...blankToNull(body), payment: blankToNull(body.payment) },
            headers.idempotencyKey,
            currentUser(res)
        );
        return this.sendResponse({ response: toReceiptDto(sale) }, replayed ? HttpStatus.OK : HttpStatus.CREATED, res);
    }

    async getById(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(saleParamsSchema, req.params);
        const sale = await this.saleService.getForViewer(value.outletId, value.saleId, currentUser(res));
        return this.sendResponse({ response: toReceiptDto(sale) }, HttpStatus.OK, res);
    }

    async list(req: Request, res: Response): Promise<any> {
        const { value: params } = await this.validateRequest(outletParamsSchema, req.params);
        const { value: query } = await this.validateRequest(outletHistorySchema, req.query);
        return this.sendHistory({ ...query, outletId: params.outletId }, res);
    }

    async listAll(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(allHistorySchema, req.query);
        return this.sendHistory(value, res);
    }

    private async sendHistory({ offset, limit, ...search }: any, res: Response): Promise<any> {
        const page = await this.saleService.list(currentUser(res), search, { offset, limit });
        return this.sendResponse({ response: toPageDto(page, toSaleSummaryDto) }, HttpStatus.OK, res);
    }
}

export const newSaleV1Controller = async (saleService: SaleServiceInterface): Promise<SaleController> => {
    return new SaleController(saleService);
};
