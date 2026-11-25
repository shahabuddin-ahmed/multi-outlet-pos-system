'use client';

import { useEffect, type PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { FullPage } from '@/components/layout/full-page';
import { PageState } from '@/components/shared/page-state';
import { useAppDispatch, useAppSelector } from '@/hooks/use-app-redux';
import { restoreSession } from '@/stores/slices/session-slice';

// Shows its children only to a signed-in person; everyone else is sent to the login page
export function RequireSession({ children }: PropsWithChildren) {
  const session = useAppSelector((state) => state.session);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (session.status === 'signedOut') {
      router.replace('/login');
    }
  }, [session.status, router]);

  if (session.status === 'signedIn') {
    return children;
  }

  const unreachable = session.status === 'unreachable';
  return (
    <FullPage>
      <PageState
        message={unreachable ? session.message : 'Loading…'}
        error={unreachable}
        onRetry={() => void dispatch(restoreSession())}
      />
    </FullPage>
  );
}
