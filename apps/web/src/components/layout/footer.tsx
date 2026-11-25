'use client';

import { useEffect, useState } from 'react';
import { useSettings } from '@/features/settings/settings-provider';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

enum ApiState {
  CHECKING = 'checking',
  HEALTHY = 'healthy',
  UNAVAILABLE = 'unavailable'
}

const API_STATE_VIEW: Record<ApiState, { label: string; dot: string }> = {
  [ApiState.CHECKING]: { label: 'Checking API…', dot: 'bg-gray-400' },
  [ApiState.HEALTHY]: { label: 'API healthy', dot: 'bg-green-600' },
  [ApiState.UNAVAILABLE]: { label: 'API unavailable', dot: 'bg-red-600' }
};

// VAT arrives in basis points: 500 is 5%
const BPS_PER_PERCENT = 100;

export function Footer() {
  const [apiState, setApiState] = useState(ApiState.CHECKING);
  const view = API_STATE_VIEW[apiState];
  const { currency, vatBps } = useSettings();

  useEffect(() => {
    api
      .health()
      .then(() => setApiState(ApiState.HEALTHY))
      .catch(() => setApiState(ApiState.UNAVAILABLE));
  }, []);

  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t px-4 py-3.5 text-xs text-gray-600 lg:px-9">
      <span>POS 1.0</span>
      <span role="status" className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className={cn('size-2 rounded-full', view.dot)} />
        {view.label}
      </span>
      <span>
        Money: {currency} · VAT {vatBps / BPS_PER_PERCENT}%
      </span>
    </footer>
  );
}
