import { ReportRange } from "../../constant/report";
import { periodOf } from "../report-period";

describe("periodOf", () => {
    // 01:00 on 1 December in Dhaka, still 30 November in UTC
    const now = new Date("2026-11-30T19:00:00Z");

    it("counts today and this month in the business time zone", () => {
        expect(periodOf({ range: ReportRange.TODAY }, "Asia/Dhaka", now)).toEqual({
            from: "2026-12-01",
            to: "2026-12-01",
        });
        expect(periodOf({ range: ReportRange.MONTH }, "UTC", now)).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    });

    it("keeps given days, and refuses them in the wrong order", () => {
        expect(periodOf({ from: "2026-11-01" }, "Asia/Dhaka", now)).toEqual({ from: "2026-11-01", to: undefined });
        expect(() => periodOf({ from: "2026-11-02", to: "2026-11-01" }, "Asia/Dhaka", now)).toThrow("start date");
    });
});
