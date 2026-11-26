export const GAP = 'gap';

// Up to this many pages are all listed
const LISTED = 7;

const from = (first: number, length: number): number[] => Array.from({ length }, (_, index) => first + index);

// The first, the last, the current page and its neighbours: 1 … 4 5 6 … 20.
// A long list always gives seven entries, so the buttons stay where they are.
export function pageNumbers(current: number, pages: number): (number | typeof GAP)[] {
  if (pages <= LISTED) {
    return from(1, pages);
  }
  if (current <= 4) {
    return [...from(1, 5), GAP, pages];
  }
  if (current >= pages - 3) {
    return [1, GAP, ...from(pages - 4, 5)];
  }
  return [1, GAP, ...from(current - 1, 3), GAP, pages];
}
