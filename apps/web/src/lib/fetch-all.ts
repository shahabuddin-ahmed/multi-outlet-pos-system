import type { ListQuery, Paged } from '@/types';

// The most the API gives in one answer
const PAGE_SIZE = 100;

// Every row of a paged list, for the few places that need the whole of it (a choice of outlets,
// everything one outlet has assigned)
export async function fetchAll<T>(loadPage: (query: ListQuery) => Promise<Paged<T>>): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const page = await loadPage({ offset: rows.length, limit: PAGE_SIZE });
    rows.push(...page.data);
    if (rows.length >= page.total || page.data.length === 0) {
      return rows;
    }
  }
}
