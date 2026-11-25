import { ERROR_CODES } from "../../constant/error";
import { HttpStatus } from "../../constant/http";
import { retrieveErrorMessage } from "../../utils/utility";

export class HttpException extends Error {
    constructor(
        private statusCode: HttpStatus,
        private code: ERROR_CODES,
        private customMessage?: string,
        private errors?: string[],
        // Data the client needs to react, sent as "response" (e.g. the new prices of a sale)
        readonly details?: object
    ) {
        super(customMessage || retrieveErrorMessage(code));
    }
}
