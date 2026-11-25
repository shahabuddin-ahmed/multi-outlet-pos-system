import { ERROR_CODES } from "../constant/error";
import { ReportRange } from "../constant/report";
import { BadRequestException } from "../web/exception/bad-request-exception";

export interface PeriodRequest {
    range?: ReportRange;
    from?: string;
    to?: string;
}

const DATES_REVERSED = "The start date is after the end date";

// The calendar day (YYYY-MM-DD) of a moment, as people in that time zone call it
export const calendarDayOf = (moment: Date, timeZone: string): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(moment);

export const assertDateOrder = (from?: string, to?: string): void => {
    if (from && to && from > to) {
        throw new BadRequestException(ERROR_CODES.E_INVALID_DATA, DATES_REVERSED);
    }
};

// A ready-made range becomes calendar days; otherwise the given days are used
export const periodOf = ({ range, from, to }: PeriodRequest, timeZone: string, now: Date) => {
    if (!range) {
        assertDateOrder(from, to);
        return { from, to };
    }
    const today = calendarDayOf(now, timeZone);
    const firstOfMonth = `${today.slice(0, "YYYY-MM-".length)}01`;
    return { from: range === ReportRange.MONTH ? firstOfMonth : today, to: today };
};
