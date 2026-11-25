'use client';

import { useAppSelector } from '@/hooks/use-app-redux';
import type { User } from '@/types';

// The signed-in person, for everything shown below RequireSession
export function useUser(): User {
  const session = useAppSelector((state) => state.session);
  if (session.status !== 'signedIn') {
    throw new Error('useUser needs RequireSession above it');
  }
  return session.user;
}
