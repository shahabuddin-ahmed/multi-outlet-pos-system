// The one place the browser adds up money. The till must show a total before the sale is made and send
// it as "expectedTotalCents". The API works it out again: if it differs, nothing is saved and the till
// shows the API's numbers. Whole paisa only; VAT rounds half up, as the API does.

const BASIS_POINTS = 10_000;

export interface Estimate {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
}

export function estimateTotals(lines: { unitPriceCents: number; quantity: number }[], vatBps: number): Estimate {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const vatCents = Math.floor((subtotalCents * vatBps + BASIS_POINTS / 2) / BASIS_POINTS);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}

// 500 → "5%"
export const vatLabel = (vatBps: number): string => `${vatBps / 100}%`;
