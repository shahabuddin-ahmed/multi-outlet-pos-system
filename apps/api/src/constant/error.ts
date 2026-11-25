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
    E_OUTLET_NOT_FOUND = "E_OUTLET_NOT_FOUND",
    E_MENU_ITEM_NOT_FOUND = "E_MENU_ITEM_NOT_FOUND",
    E_DUPLICATE_OUTLET_CODE = "E_DUPLICATE_OUTLET_CODE",
    E_DUPLICATE_SKU = "E_DUPLICATE_SKU",
    E_UNAUTHENTICATED = "E_UNAUTHENTICATED",
    E_INVALID_CREDENTIALS = "E_INVALID_CREDENTIALS",
    E_FORBIDDEN = "E_FORBIDDEN",
    E_OUTLET_INACTIVE = "E_OUTLET_INACTIVE",
    E_USER_NOT_FOUND = "E_USER_NOT_FOUND",
    E_DUPLICATE_EMAIL = "E_DUPLICATE_EMAIL",
    E_ITEM_NOT_ASSIGNED = "E_ITEM_NOT_ASSIGNED",
    E_INSUFFICIENT_STOCK = "E_INSUFFICIENT_STOCK",
    E_STOCK_ABOVE_LIMIT = "E_STOCK_ABOVE_LIMIT",
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
    E_OUTLET_NOT_FOUND: {
        message: "Outlet not found",
    },
    E_MENU_ITEM_NOT_FOUND: {
        message: "Menu item not found",
    },
    E_DUPLICATE_OUTLET_CODE: {
        message: "An outlet with this code already exists",
    },
    E_DUPLICATE_SKU: {
        message: "A menu item with this SKU already exists",
    },
    E_UNAUTHENTICATED: {
        message: "Please sign in again",
    },
    E_INVALID_CREDENTIALS: {
        message: "Email or password is incorrect",
    },
    E_FORBIDDEN: {
        message: "You are not allowed to do this",
    },
    E_OUTLET_INACTIVE: {
        message: "Your outlet is switched off. Contact head office.",
    },
    E_USER_NOT_FOUND: {
        message: "User not found",
    },
    E_DUPLICATE_EMAIL: {
        message: "A user with this email already exists",
    },
    E_ITEM_NOT_ASSIGNED: {
        message: "This item is not assigned to this outlet",
    },
    E_INSUFFICIENT_STOCK: {
        message: "Not enough stock",
    },
    E_STOCK_ABOVE_LIMIT: {
        message: "Stock cannot go above 1,000,000",
    },
};

export enum ApiResponseMessages {
    SUCCESS = "SUCCESS",
    SUCCESS_MESSAGE = "Success",
}
