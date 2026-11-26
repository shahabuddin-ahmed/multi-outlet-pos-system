// The taka notes a customer is likely to pay with, in paisa
const NOTES_CENTS = [10_000, 50_000, 100_000];

// One-press amounts for "cash received": the total itself, then the total rounded up to each note.
// They only fill in the field; the API checks that the cash covers the sale.
export function cashSuggestions(totalCents: number): number[] {
  const roundedUp = NOTES_CENTS.map((note) => Math.ceil(totalCents / note) * note);
  return [...new Set([totalCents, ...roundedUp])];
}
