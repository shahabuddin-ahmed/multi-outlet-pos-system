import { ObjectSchema } from "joi";
import { Response } from "express";
import { errorMessages, ERROR_CODES, ApiResponseMessages } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { BadRequestException } from "../exception/bad-request-exception";

export interface ResponseType {
    code?: string;
    message?: string;
    response: Record<string, any> | Record<string, any>[] | null;
    errors?: string[];
}

export abstract class Controller {
    sendResponse(requestedData: ResponseType, statusCode: number, res: Response): any {
        const isServerError = statusCode >= HttpStatus.INTERNAL_SERVER_ERROR;
        const defaultMessage = isServerError
            ? errorMessages.E_INTERNAL_SERVER_ERROR.message
            : ApiResponseMessages.SUCCESS_MESSAGE;

        return res.status(statusCode).send({
            code: isServerError ? ERROR_CODES.E_INTERNAL_SERVER_ERROR : ApiResponseMessages.SUCCESS,
            message: requestedData.message || defaultMessage,
            response: requestedData.response || null,
            errors: this.errorsOf(requestedData, isServerError),
        } as ResponseType);
    }

    private errorsOf(requestedData: ResponseType, isServerError: boolean): string[] {
        if (requestedData.errors?.length) {
            return requestedData.errors;
        }
        if (isServerError) {
            return [`${requestedData.message}`];
        }
        return [];
    }

    // Unknown fields are rejected, so a client can never set a column the schema does not list
    async validateRequest(schema: ObjectSchema, data: any): Promise<{ value?: any }> {
        const { value, error } = schema.validate(data, { abortEarly: false, allowUnknown: false });

        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, "", errorMessages);
        }

        return { value };
    }
}
