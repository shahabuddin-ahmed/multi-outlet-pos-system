import { ERROR_CODES } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { retrieveErrorMessage } from "../../utils/utility";

export class HttpException extends Error {
    constructor(
        private statusCode: HttpStatus,
        private code: ERROR_CODES,
        private customMessage?: string,
        private errors?: string[]
    ) {
        super(customMessage || retrieveErrorMessage(code));
    }
}
