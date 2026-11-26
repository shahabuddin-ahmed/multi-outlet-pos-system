'use client';

import { useConnection, type ConnectionState } from '@/components/layout/connection';
import { useSettings } from '@/features/settings/settings-provider';
import { cn } from '@/lib/utils';

const CONNECTION_VIEW: Record<ConnectionState, { label: string; dot: string }> = {
  checking: { label: 'Checking connection…', dot: 'bg-gray-400' },
  online: { label: 'Connected', dot: 'bg-green-600' },
  offline: { label: 'No internet', dot: 'bg-red-600' },
  unreachable: { label: 'Server not answering', dot: 'bg-red-600' }
};

// VAT arrives in basis points: 500 is 5%
const BPS_PER_PERCENT = 100;

export function Footer() {
  const view = CONNECTION_VIEW[useConnection().state];
  const { currency, vatBps } = useSettings();

  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t px-4 py-3.5 text-xs text-gray-600 lg:px-9">
      <span>POS 1.0</span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className={cn('size-2 rounded-full', view.dot)} />
        {view.label}
      </span>
      <span>
        Money: {currency} · VAT {vatBps / BPS_PER_PERCENT}%
      </span>
    </footer>
  );
}
