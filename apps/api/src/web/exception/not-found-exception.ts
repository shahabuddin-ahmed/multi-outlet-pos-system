import { ERROR_CODES } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { HttpException } from "./http-exception";

export class NotFoundException extends HttpException {
    constructor(code: ERROR_CODES, customMessage?: string, errors?: string[]) {
        super(HttpStatus.NOT_FOUND, code, customMessage, errors);
    }
}
