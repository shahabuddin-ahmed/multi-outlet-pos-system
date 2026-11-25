'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, errorMessage } from '@/lib/api';

interface Result<T> {
  load: () => Promise<T>;
  version: number;
  data: T | null;
  error: string;
  errorCode: string;
}

interface ApiData<T> {
  data: T | null;
  error: string;
  // The backend error code (for example E_OUTLET_NOT_FOUND); empty when the API could not be reached
  errorCode: string;
  loading: boolean;
  // Loads again: after a change, or to retry after an error
  reload: () => void;
  // Changes what is shown without loading, with an answer the API has just given
  update: (change: (data: T) => T) => void;
}

// Runs `load` again whenever it changes (wrap it in useMemo or useCallback).
// The last data stays on screen while new data loads, and a late answer to an old request is dropped.
export function useApiData<T>(load: (() => Promise<T>) | null): ApiData<T> {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!load) {
      return;
    }
    let current = true;
    load().then(
      (data) => current && setResult({ load, version, data, error: '', errorCode: '' }),
      (error: unknown) =>
        current &&
        setResult({
          load,
          version,
          data: null,
          error: errorMessage(error),
          errorCode: error instanceof ApiError ? error.code : ''
        })
    );
    return () => {
      current = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const update = useCallback((change: (data: T) => T) => {
    setResult((current) => (current && current.data !== null ? { ...current, data: change(current.data) } : current));
  }, []);
  const fresh = result?.load === load && result?.version === version;
  return {
    data: result?.data ?? null,
    error: fresh ? result.error : '',
    errorCode: fresh ? result.errorCode : '',
    loading: load !== null && !fresh,
    reload,
    update
  };
}
