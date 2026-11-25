'use client';

import type { PropsWithChildren } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser } from '@/features/session/use-user';
import { canOpen, homeOf } from '@/lib/access';

// A page typed into the address bar by someone whose role does not have it
export function RequirePageAccess({ children }: PropsWithChildren) {
  const { role } = useUser();
  const pathname = usePathname();

  if (canOpen(role, pathname)) {
    return children;
  }

  return (
    <Card role="alert">
      <EmptyState icon={Lock} title="You cannot open this page" text="Your role does not allow it.">
        <Link href={homeOf(role)} className={buttonVariants()}>
          Go to your home page
        </Link>
      </EmptyState>
    </Card>
  );
}
