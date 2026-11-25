import { Request, Response } from "express";
import { HttpStatus } from "../../../constant/http";
import { InventoryServiceInterface } from "../../../service/inventory";
import { toLowStockDto } from "../../dto/inventory";
import { toPageDto } from "../../dto/page";
import { Controller } from "../controller";
import { pageQuerySchema } from "./common-schema";

export interface ReportControllerInterface {
    lowStock(req: Request, res: Response): Promise<any>;
}

export class ReportController extends Controller implements ReportControllerInterface {
    constructor(private inventoryService: InventoryServiceInterface) {
        super();
        this.lowStock = this.lowStock.bind(this);
    }

    async lowStock(req: Request, res: Response): Promise<any> {
        const { value } = await this.validateRequest(pageQuerySchema, req.query);
        const page = await this.inventoryService.lowStock(value);
        return this.sendResponse({ response: toPageDto(page, toLowStockDto) }, HttpStatus.OK, res);
    }
}

export const newReportV1Controller = async (inventoryService: InventoryServiceInterface): Promise<ReportController> => {
    return new ReportController(inventoryService);
};
