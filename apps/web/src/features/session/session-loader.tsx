'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/use-app-redux';
import { onSessionEnded } from '@/lib/api';
import { restoreSession, signOut } from '@/stores/slices/session-slice';

// Runs once for the whole app: brings back the stored login, and signs out when the server ends it
export function SessionLoader() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stopListening = onSessionEnded((error) => dispatch(signOut(error.message)));
    void dispatch(restoreSession());
    return stopListening;
  }, [dispatch]);

  return null;
}
