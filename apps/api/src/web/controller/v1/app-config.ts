import { Request, Response } from "express";
import { BusinessConfig } from "../../../config/config";
import { HttpStatus } from "../../../constant/http";
import { toAppConfigDto } from "../../dto/app-config";
import { Controller } from "../controller";

export interface AppConfigControllerInterface {
    get(req: Request, res: Response): Promise<any>;
}

export class AppConfigController extends Controller implements AppConfigControllerInterface {
    constructor(private business: BusinessConfig) {
        super();
        this.get = this.get.bind(this);
    }

    async get(_req: Request, res: Response): Promise<any> {
        return this.sendResponse({ response: toAppConfigDto(this.business) }, HttpStatus.OK, res);
    }
}

export const newAppConfigV1Controller = async (business: BusinessConfig): Promise<AppConfigController> => {
    return new AppConfigController(business);
};
