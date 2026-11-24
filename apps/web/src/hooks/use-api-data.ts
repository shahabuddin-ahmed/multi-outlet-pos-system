'use client';

import { useEffect, useState } from 'react';
import { ApiError, errorMessage } from '@/lib/api';

interface Result<T> {
  load: () => Promise<T>;
  data: T | null;
  error: string;
  errorCode: string;
}

interface ApiData<T> {
  data: T | null;
  error: string;
  // The backend error code (for example E_NOT_FOUND); empty when the API could not be reached
  errorCode: string;
  loading: boolean;
}

// Runs `load` again whenever it changes (wrap it in useMemo or useCallback).
// The last data stays on screen while new data loads, and a late answer to an old request is dropped.
export function useApiData<T>(load: (() => Promise<T>) | null): ApiData<T> {
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!load) {
      return;
    }
    let current = true;
    load().then(
      (data) => current && setResult({ load, data, error: '', errorCode: '' }),
      (error: unknown) =>
        current &&
        setResult({
          load,
          data: null,
          error: errorMessage(error),
          errorCode: error instanceof ApiError ? error.code : ''
        })
    );
    return () => {
      current = false;
    };
  }, [load]);

  const fresh = result?.load === load;
  return {
    data: result?.data ?? null,
    error: fresh ? result.error : '',
    errorCode: fresh ? result.errorCode : '',
    loading: load !== null && !fresh
  };
}
