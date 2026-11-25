import { BusinessConfig } from "../config/config";
import { TOP_ITEMS_PER_OUTLET } from "../constant/report";
import { OutletInterface } from "../model/outlet";
import { OutletRevenueRecord, ReportPeriod, ReportRepoInterface, SalesTotals, TopItemRecord } from "../repo/report";
import { OutletServiceInterface } from "./outlet";
import { ListQuery, Page, toPage } from "./page";
import { PeriodRequest, periodOf } from "./report-period";

export interface RevenueReport {
    period: ReportPeriod;
    // All outlets together, whatever page is shown
    totals: SalesTotals;
    outlets: Page<OutletRevenueRecord>;
}

export interface OutletTopItems {
    outlet: OutletInterface;
    items: TopItemRecord[];
}

export interface TopItemsReport {
    period: ReportPeriod;
    outlets: Page<OutletTopItems>;
}

export interface ReportServiceInterface {
    revenueByOutlet(request: PeriodRequest, query: ListQuery): Promise<RevenueReport>;
    topItems(request: PeriodRequest, query: ListQuery, outletPublicId?: string): Promise<TopItemsReport>;
}

export class ReportService implements ReportServiceInterface {
    constructor(
        private repo: ReportRepoInterface,
        private outletService: OutletServiceInterface,
        private business: BusinessConfig
    ) {}

    async revenueByOutlet(request: PeriodRequest, query: ListQuery): Promise<RevenueReport> {
        const period = this.periodFor(request);
        const [rows, totals] = await Promise.all([
            this.repo.revenueByOutlet(period, query),
            this.repo.revenueTotals(period),
        ]);
        return { period, totals, outlets: toPage(rows, query) };
    }

    // One page of outlets (or only the one asked for), each with its best sellers
    async topItems(request: PeriodRequest, query: ListQuery, outletPublicId?: string): Promise<TopItemsReport> {
        const period = this.periodFor(request);
        const outlets = outletPublicId
            ? { data: [await this.outletService.getByPublicId(outletPublicId)], offset: 0, limit: 1, total: 1 }
            : await this.outletService.list(query);

        const ids = outlets.data.map((outlet) => outlet.id);
        const items = ids.length > 0 ? await this.repo.topItems(ids, period, TOP_ITEMS_PER_OUTLET) : [];

        return {
            period,
            outlets: {
                ...outlets,
                data: outlets.data.map((outlet) => ({
                    outlet,
                    items: items.filter((item) => item.outletKey === outlet.id),
                })),
            },
        };
    }

    private periodFor(request: PeriodRequest): ReportPeriod {
        const timezone = this.business.BUSINESS_TIMEZONE;
        return { ...periodOf(request, timezone, new Date()), timezone };
    }
}

export const newReportService = async (
    repo: ReportRepoInterface,
    outletService: OutletServiceInterface,
    business: BusinessConfig
): Promise<ReportService> => {
    return new ReportService(repo, outletService, business);
};
