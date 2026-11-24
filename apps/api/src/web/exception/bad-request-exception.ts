import { ERROR_CODES } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { HttpException } from "./http-exception";

export class BadRequestException extends HttpException {
    constructor(code: ERROR_CODES, customMessage?: string, errors?: string[]) {
        super(HttpStatus.BAD_REQUEST, code, customMessage, errors);
    }
}
