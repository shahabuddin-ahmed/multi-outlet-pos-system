// Defaults for a company in Bangladesh. Every value can be changed with an environment variable.
export const BUSINESS_DEFAULTS = {
    TIMEZONE: "Asia/Dhaka",
    CURRENCY: "BDT",
    // VAT in basis points (500 = 5%). 0 until the operator sets the legal rate.
    VAT_BPS: 0,
    COMPANY_NAME: "POS Company",
    COMPANY_TAX_NO: "",
    RECEIPT_FOOTER: "Thank you! Visit again.",
} as const;

export const VAT_BPS_MAX = 10_000;
export const CURRENCY_PATTERN = /^[A-Z]{3}$/;
