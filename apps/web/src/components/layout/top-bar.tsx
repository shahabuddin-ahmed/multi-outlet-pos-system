'use client';

import { Store } from 'lucide-react';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserMenu } from '@/components/layout/user-menu';
import { useUser } from '@/features/session/use-user';

export function TopBar() {
  const { outlet } = useUser();

  return (
    <header className="flex h-16 items-center gap-2 border-b bg-card px-3 lg:px-9">
      <MobileNav />
      <span className="mr-auto inline-flex h-10 min-w-0 items-center gap-2 rounded-[10px] border bg-secondary px-3 text-sm font-medium">
        <Store aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{outlet ? `${outlet.name} (${outlet.code})` : 'HQ · all outlets'}</span>
      </span>
      <UserMenu />
    </header>
  );
}
