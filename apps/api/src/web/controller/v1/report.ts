import { Request, Response } from "express";
import Joi from "joi";
import { PAGINATION } from "../../../constant/api";
import { HttpStatus } from "../../../constant/http";
import { ReportRange } from "../../../constant/report";
import { InventoryServiceInterface } from "../../../service/inventory";
import { ReportServiceInterface } from "../../../service/report";
import { toLowStockDto } from "../../dto/inventory";
import { toPageDto } from "../../dto/page";
import { toRevenueReportDto, toTopItemsReportDto } from "../../dto/report";
import { Controller } from "../controller";
import { calendarDateSchema, pageFields, pageQuerySchema, publicIdSchema } from "./common-schema";

export interface ReportControllerInterface {
    revenueByOutlet(req: Request, res: Response): Promise<any>;
    topItems(req: Request, res: Response): Promise<any>;
    lowStock(req: Request, res: Response): Promise<any>;
}

// Either a ready-made range or own dates, not both
const periodSchema = (fields: Joi.SchemaMap = {}) =>
    Joi.object({
        range: Joi.string().valid(...Object.values(ReportRange)),
        from: calendarDateSchema,
        to: calendarDateSchema,
        ...pageFields(PAGINATION.DEFAULT_LIST_LIMIT),
        ...fields,
    }).without("range", ["from", "to"]);

const revenueSchema = periodSchema();
const topItemsSchema = periodSchema({ outletId: publicIdSchema });

export class ReportController extends Controller implements ReportControllerInterface {
    constructor(
        private reportService: ReportServiceInterface,
        private inventoryService: InventoryServiceInterface
    ) {
        super();
        this.revenueByOutlet = this.revenueByOutlet.bind(this);
        this.topItems = this.topItems.bind(this);
        this.lowStock = this.lowStock.bind(this);
    }

    async revenueByOutlet(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(revenueSchema, req.query);
        const { offset, limit, ...period } = value;
        const report = await this.reportService.revenueByOutlet(period, { offset, limit });
        return this.sendResponse({ response: toRevenueReportDto(report) }, HttpStatus.OK, res);
    }

    async topItems(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(topItemsSchema, req.query);
        const { offset, limit, outletId, ...period } = value;
        const report = await this.reportService.topItems(period, { offset, limit }, outletId);
        return this.sendResponse({ response: toTopItemsReportDto(report) }, HttpStatus.OK, res);
    }

    async lowStock(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(pageQuerySchema, req.query);
        const page = await this.inventoryService.lowStock(value);
        return this.sendResponse({ response: toPageDto(page, toLowStockDto) }, HttpStatus.OK, res);
    }
}

export const newReportV1Controller = async (
    reportService: ReportServiceInterface,
    inventoryService: InventoryServiceInterface
): Promise<ReportController> => {
    return new ReportController(reportService, inventoryService);
};
