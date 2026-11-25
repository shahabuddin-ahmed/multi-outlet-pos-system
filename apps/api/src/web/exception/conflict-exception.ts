import { ERROR_CODES } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { HttpException } from "./http-exception";

export class ConflictException extends HttpException {
    constructor(code: ERROR_CODES, customMessage?: string, errors?: string[], details?: object) {
        super(HttpStatus.CONFLICT, code, customMessage, errors, details);
    }
}
