import Joi from "joi";
import { PAGINATION, SEARCH_MAX_LENGTH, UUID_PATTERN } from "../../../constant/api";

// Records are addressed by their public UUID only
export const publicIdSchema = Joi.string()
    .pattern(UUID_PATTERN)
    .messages({ "string.pattern.base": "{{#label}} must be a valid id" });

export const outletParamsSchema = Joi.object({
    outletId: publicIdSchema.required(),
});

export const menuItemParamsSchema = Joi.object({
    menuItemId: publicIdSchema.required(),
});

const newListQuerySchema = (defaultLimit: number) =>
    Joi.object({
        // An empty search box means "no search"
        search: Joi.string().trim().max(SEARCH_MAX_LENGTH).empty(""),
        offset: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIST_LIMIT).default(defaultLimit),
    });

export const listQuerySchema = newListQuerySchema(PAGINATION.DEFAULT_LIST_LIMIT);
export const menuQuerySchema = newListQuerySchema(PAGINATION.DEFAULT_MENU_LIMIT);

// A text field the user may clear: "" and null both mean "nothing"
export const optionalText = (maxLength: number) => Joi.string().trim().max(maxLength).allow("", null);

// Money is accepted only as a real whole number, never as text
export const priceCentsSchema = (maxCents: number) => Joi.number().strict().integer().min(0).max(maxCents);
