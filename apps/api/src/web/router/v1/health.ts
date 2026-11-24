import { Router } from "express";
import newSequelize from "../../../infra/sequelize";
import { ApiResponseMessages, ERROR_CODES } from "../../../constant/error";
import { HttpStatus } from "../../../constant/http";
import { DatabaseStatus, HealthMessages, HealthReport, SERVICE_NAME, ServiceStatus } from "../../../constant/health";
import { ResponseType } from "../../controller/controller";

const checkDatabase = async (): Promise<DatabaseStatus> => {
    try {
        await newSequelize().authenticate();
        return DatabaseStatus.UP;
    } catch {
        return DatabaseStatus.DOWN;
    }
};

export const newHealthRouter = async (): Promise<Router> => {
    const router = Router();

    router.get("/", async (_req, res) => {
        const database = await checkDatabase();
        const healthy = database === DatabaseStatus.UP;

        const report: HealthReport = {
            service: SERVICE_NAME,
            status: healthy ? ServiceStatus.OK : ServiceStatus.DEGRADED,
            database,
        };

        const body: ResponseType = {
            code: healthy ? ApiResponseMessages.SUCCESS : ERROR_CODES.E_SERVICE_UNAVAILABLE,
            message: healthy ? HealthMessages.HEALTHY : HealthMessages.DEGRADED,
            response: report,
            errors: healthy ? [] : [HealthMessages.DATABASE_CONNECTION_FAILED],
        };

        return res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).send(body);
    });

    return router;
};
