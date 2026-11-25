import { ERROR_CODES, errorMessages } from "../constant/error";
import { RECEIPT_NUMBER_DIGITS } from "../constant/sale";

export const retrieveErrorMessage = (errorCode: ERROR_CODES): string => errorMessages[errorCode].message;

// "Contains" pattern for LIKE and ILIKE: a %, _ or \ typed by the user is searched as it is
export const containsPattern = (text: string): string => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

// The receipt number as printed, e.g. DHK-000042
export const receiptCodeOf = (outletCode: string, receiptNo: number): string =>
    `${outletCode}-${String(receiptNo).padStart(RECEIPT_NUMBER_DIGITS, "0")}`;

// A cleared text field arrives as "" and is stored as NULL
export const blankToNull = <T extends object>(input: T): T =>
    Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
