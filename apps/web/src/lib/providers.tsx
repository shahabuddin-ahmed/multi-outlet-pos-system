'use client';

import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { SessionLoader } from '@/features/session/session-loader';
import { store } from '@/stores/store';

export function Providers({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <SessionLoader />
      {children}
      <Toaster position="bottom-right" />
    </Provider>
  );
}
