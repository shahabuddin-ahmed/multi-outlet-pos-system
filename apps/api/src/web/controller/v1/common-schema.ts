import Joi from "joi";
import { PAGINATION } from "../../../constant/api";

export const idParamsSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const listQuerySchema = Joi.object({
    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIST_LIMIT).default(PAGINATION.DEFAULT_LIST_LIMIT),
});
