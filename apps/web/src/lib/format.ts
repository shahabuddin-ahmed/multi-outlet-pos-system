const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const CENTS_PER_UNIT = 100;
const CURRENCY = 'USD';
const MONEY_FORMAT = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY });

// "2026-11-25T10:00:00.000Z" → "25 Nov 2026" (on the user's own clock)
export function formatDate(moment: string | Date): string {
  return DATE_FORMAT.format(new Date(moment));
}

// Money travels as integer cents: 1250 → "$12.50". Only for showing it, never for calculating.
export function formatMoney(cents: number): string {
  return MONEY_FORMAT.format(cents / CENTS_PER_UNIT);
}
