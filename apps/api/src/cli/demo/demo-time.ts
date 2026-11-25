const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// The moment today started in a time zone. Exact for zones without daylight saving, such as Asia/Dhaka.
const startOfDay = (moment: Date, timeZone: string): number => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(moment);
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const sinceMidnight = (read("hour") * 3600 + read("minute") * 60 + read("second")) * 1000;
    return moment.getTime() - sinceMidnight - moment.getMilliseconds();
};

export interface TradingDay {
    midnight: number;
    opensAt: number;
    closesAt: number;
}

// The last "days" days up to now, oldest first. Today ends now, so no sale lies in the future.
export const tradingDays = (
    now: Date,
    timeZone: string,
    days: number,
    hours: { opens: number; closes: number }
): TradingDay[] => {
    const today = startOfDay(now, timeZone);
    return Array.from({ length: days }, (_, index) => {
        const midnight = today - (days - 1 - index) * DAY_MS;
        const closesAt = Math.min(midnight + hours.closes * HOUR_MS, now.getTime());
        const opening = midnight + hours.opens * HOUR_MS;
        // Run before opening time: today's sales fall between midnight and now
        return { midnight, opensAt: opening < closesAt ? opening : midnight, closesAt };
    });
};

export const atHour = ({ midnight }: TradingDay, hour: number): Date => new Date(midnight + hour * HOUR_MS);
