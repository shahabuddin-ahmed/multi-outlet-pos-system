// Turns what a person types as a price into whole paisa and back. Text is split, never multiplied as a
// decimal number, so no rounding can creep in. The API checks the value again.
export const PRICE_MAX_CENTS = 10_000_000;
export const PRICE_HINT = 'Enter a price from 0 to 100000.00, without commas';

const PRICE_PATTERN = /^(\d{1,6})(?:\.(\d{1,2}))?$/;
const CENTS_PER_UNIT = 100;

// null: not a price. Commas are refused: "12,50" could mean two different amounts.
export function parsePrice(text: string): number | null {
  const match = PRICE_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  const [, whole, fraction = ''] = match;
  const cents = Number(whole) * CENTS_PER_UNIT + Number(fraction.padEnd(2, '0'));
  return cents <= PRICE_MAX_CENTS ? cents : null;
}

// 35000 → "350.00", the form a price field holds
export function priceText(cents: number): string {
  const whole = Math.trunc(cents / CENTS_PER_UNIT);
  return `${whole}.${String(cents % CENTS_PER_UNIT).padStart(2, '0')}`;
}
