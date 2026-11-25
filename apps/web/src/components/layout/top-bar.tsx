'use client';

import { LogOut, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser } from '@/features/session/use-user';
import { useAppDispatch } from '@/hooks/use-app-redux';
import { ROLE_LABELS } from '@/lib/access';
import { signOut } from '@/stores/slices/session-slice';

export function TopBar() {
  const { fullName, role, outlet } = useUser();
  const dispatch = useAppDispatch();

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-2.5 lg:px-9">
      <span className="inline-flex h-10 max-w-full items-center gap-2 rounded-[10px] border bg-secondary px-3 text-sm font-medium">
        <Store aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{outlet ? `${outlet.name} (${outlet.code})` : 'HQ · all outlets'}</span>
      </span>
      <span className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{fullName}</span>
          <Badge variant="primary">{ROLE_LABELS[role]}</Badge>
        </span>
        <Button variant="outline" size="sm" onClick={() => dispatch(signOut())}>
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </Button>
      </span>
    </header>
  );
}
