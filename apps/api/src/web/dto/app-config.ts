import { BusinessConfig } from "../../config/config";

// For display only: the server uses its own settings when it prices a sale
export interface AppConfigDto {
    companyName: string;
    companyTaxNo: string;
    currency: string;
    vatBps: number;
    timezone: string;
}

export const toAppConfigDto = (business: BusinessConfig): AppConfigDto => ({
    companyName: business.COMPANY_NAME,
    companyTaxNo: business.COMPANY_TAX_NO,
    currency: business.CURRENCY,
    vatBps: business.VAT_BPS,
    timezone: business.BUSINESS_TIMEZONE,
});
