'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/features/session/use-user';
import { homeOf } from '@/lib/access';

export function RedirectHome() {
  const { role } = useUser();
  const router = useRouter();

  useEffect(() => {
    router.replace(homeOf(role));
  }, [role, router]);

  return null;
}
