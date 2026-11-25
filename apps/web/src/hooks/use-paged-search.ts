'use client';

import { useCallback, useMemo, useState } from 'react';
import { useApiData } from '@/hooks/use-api-data';
import { useDebounced } from '@/hooks/use-debounced';
import type { ListQuery, Paged } from '@/types';

export const LIST_PAGE_SIZE = 25;

// A searchable, paged list. `loadPage` must stay the same function between renders (an `api` call does).
export function usePagedSearch<T>(loadPage: (query: ListQuery) => Promise<Paged<T>>) {
  const [search, setSearchText] = useState('');
  const [offset, setOffset] = useState(0);
  const settled = useDebounced(search.trim());

  const load = useMemo(
    () => () => loadPage({ offset, limit: LIST_PAGE_SIZE, search: settled }),
    [loadPage, offset, settled]
  );
  const result = useApiData(load);

  // A new search starts on the first page
  const setSearch = useCallback((text: string) => {
    setSearchText(text);
    setOffset(0);
  }, []);

  return { ...result, search, setSearch, setOffset, searching: settled !== '' };
}
