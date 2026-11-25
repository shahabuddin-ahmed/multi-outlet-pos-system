'use client';

import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { FullPage } from '@/components/layout/full-page';
import { PageState } from '@/components/shared/page-state';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';
import { newFormatters, type Formatters } from '@/lib/format';
import type { AppConfig } from '@/types';

type Settings = AppConfig & Formatters;

const SettingsContext = createContext<Settings | null>(null);

// Currency, VAT rate and time zone come from the API, so no screen shows money before they are known
export function SettingsProvider({ children }: PropsWithChildren) {
  const { data, error, reload } = useApiData(api.appConfig);
  const settings = useMemo(() => (data ? { ...data, ...newFormatters(data) } : null), [data]);

  if (!settings) {
    return (
      <FullPage>
        <PageState message={error || 'Loading settings…'} error={Boolean(error)} onRetry={reload} />
      </FullPage>
    );
  }

  return <SettingsContext value={settings}>{children}</SettingsContext>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) {
    throw new Error('useSettings needs a SettingsProvider above it');
  }
  return settings;
}
