import { ERROR_CODES, errorMessages } from "../constant/error";

export const retrieveErrorMessage = (errorCode: ERROR_CODES): string => errorMessages[errorCode].message;

// "Contains" pattern for LIKE and ILIKE: a %, _ or \ typed by the user is searched as it is
export const containsPattern = (text: string): string => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

// A cleared text field arrives as "" and is stored as NULL
export const blankToNull = <T extends object>(input: T): T =>
    Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
