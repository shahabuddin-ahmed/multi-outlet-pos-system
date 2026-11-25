import { ReportPeriod, SalesTotals } from "../../repo/report";
import { RevenueReport, TopItemsReport } from "../../service/report";
import { toPageDto } from "./page";

export interface PeriodDto {
    from: string | null;
    to: string | null;
    timezone: string;
}

const toPeriodDto = ({ from, to, timezone }: ReportPeriod): PeriodDto => ({
    from: from ?? null,
    to: to ?? null,
    timezone,
});

const toTotalsDto = ({ salesCount, netSalesCents, vatCents, totalCents }: SalesTotals): SalesTotals => ({
    salesCount,
    netSalesCents,
    vatCents,
    totalCents,
});

export const toRevenueReportDto = ({ period, totals, outlets }: RevenueReport) => ({
    period: toPeriodDto(period),
    totals: toTotalsDto(totals),
    ...toPageDto(outlets, (record) => ({
        outlet: { id: record.outletId, code: record.code, name: record.name, isActive: record.isActive },
        ...toTotalsDto(record),
    })),
});

export const toTopItemsReportDto = ({ period, outlets }: TopItemsReport) => ({
    period: toPeriodDto(period),
    ...toPageDto(outlets, ({ outlet, items }) => ({
        outlet: { id: outlet.publicId, code: outlet.code, name: outlet.name, isActive: outlet.isActive },
        items: items.map(({ menuItemId, sku, name, quantity, netSalesCents }) => ({
            menuItemId,
            sku,
            name,
            quantity,
            netSalesCents,
        })),
    })),
});
