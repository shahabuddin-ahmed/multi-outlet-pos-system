import { ERROR_CODES } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { HttpException } from "./http-exception";

export class UnprocessableEntityException extends HttpException {
    constructor(code: ERROR_CODES, customMessage?: string, errors?: string[]) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, code, customMessage, errors);
    }
}
