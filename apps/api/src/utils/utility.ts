import { ERROR_CODES, errorMessages } from "../constant/error";

export const retrieveErrorMessage = (errorCode: ERROR_CODES): string => errorMessages[errorCode].message;
