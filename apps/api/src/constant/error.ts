export enum ERROR_CODES {
    E_PAGE_NOT_FOUND = "E_PAGE_NOT_FOUND",
    E_INVALID_DATA = "E_INVALID_DATA",
    E_INTERNAL_SERVER_ERROR = "E_INTERNAL_SERVER_ERROR",
    E_SERVICE_UNAVAILABLE = "E_SERVICE_UNAVAILABLE",
    E_CONFLICT = "E_CONFLICT",
    E_NOT_FOUND = "E_NOT_FOUND",
    E_UNPROCESSABLE = "E_UNPROCESSABLE",
    E_TOO_MANY_REQUESTS = "E_TOO_MANY_REQUESTS",
    E_PAYLOAD_TOO_LARGE = "E_PAYLOAD_TOO_LARGE",
}

export const errorMessages: Record<ERROR_CODES, { message: string }> = {
    E_PAGE_NOT_FOUND: {
        message: "The requested endpoint does not exist",
    },
    E_INVALID_DATA: {
        message: "Please provide valid data",
    },
    E_INTERNAL_SERVER_ERROR: {
        message: "Internal Server Error",
    },
    E_SERVICE_UNAVAILABLE: {
        message: "Service temporarily unavailable",
    },
    E_CONFLICT: {
        message: "The request conflicts with existing data",
    },
    E_NOT_FOUND: {
        message: "Not found",
    },
    E_UNPROCESSABLE: {
        message: "The request is valid but cannot be done",
    },
    E_TOO_MANY_REQUESTS: {
        message: "Too many requests. Wait a minute and try again.",
    },
    E_PAYLOAD_TOO_LARGE: {
        message: "The request body is too large.",
    },
};

export enum ApiResponseMessages {
    SUCCESS = "SUCCESS",
    SUCCESS_MESSAGE = "Success",
}
