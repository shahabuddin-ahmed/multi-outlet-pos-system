import { Request } from "express";
import Joi from "joi";
import { IDEMPOTENCY_HEADER, PAGINATION, SEARCH_MAX_LENGTH, UUID_PATTERN } from "../../../constant/api";
import { CALENDAR_DATE_PATTERN } from "../../../constant/sale";

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

// One menu item at one outlet
export const outletItemParamsSchema = Joi.object({
    outletId: publicIdSchema.required(),
    menuItemId: publicIdSchema.required(),
});

// The retry key is read from its header and checked like any other input
export const idempotencyHeaderSchema = Joi.object({
    idempotencyKey: publicIdSchema.required().label(IDEMPOTENCY_HEADER),
});

export const idempotencyInputOf = (req: Request) => ({
    idempotencyKey: req.header(IDEMPOTENCY_HEADER)?.toLowerCase(),
});

export const pageFields = (defaultLimit: number) => ({
    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIST_LIMIT).default(defaultLimit),
});

const newListQuerySchema = (defaultLimit: number) =>
    Joi.object({
        // An empty search box means "no search"
        search: Joi.string().trim().max(SEARCH_MAX_LENGTH).empty(""),
        ...pageFields(defaultLimit),
    });

// For lists with a fixed order and no search box
export const pageQuerySchema = Joi.object(pageFields(PAGINATION.DEFAULT_LIST_LIMIT));
export const listQuerySchema = newListQuerySchema(PAGINATION.DEFAULT_LIST_LIMIT);
export const menuQuerySchema = newListQuerySchema(PAGINATION.DEFAULT_MENU_LIMIT);

// A day as YYYY-MM-DD that really exists (30 February does not)
export const calendarDateSchema = Joi.string()
    .pattern(CALENDAR_DATE_PATTERN)
    .custom((value: string, helpers) => {
        const day = new Date(`${value}T00:00:00Z`);
        const exists = !Number.isNaN(day.getTime()) && day.toISOString().startsWith(value);
        return exists ? value : helpers.error("string.pattern.base");
    })
    .messages({ "string.pattern.base": "{{#label}} must be a date as YYYY-MM-DD (year 1900 to 2999)" })
    .empty("");

// A text field the user may clear: "" and null both mean "nothing"
export const optionalText = (maxLength: number) => Joi.string().trim().max(maxLength).allow("", null);

// Money is accepted only as a real whole number, never as text
export const priceCentsSchema = (maxCents: number) => Joi.number().strict().integer().min(0).max(maxCents);
