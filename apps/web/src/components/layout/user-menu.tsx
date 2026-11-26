'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/features/session/use-user';
import { useAppDispatch } from '@/hooks/use-app-redux';
import { ROLE_LABELS } from '@/lib/access';
import { signOut } from '@/stores/slices/session-slice';

// The first letters of the first two words of a name
const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

// Who is signed in, and the way out
export function UserMenu() {
  const { fullName, email, role } = useUser();
  const dispatch = useAppDispatch();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account: ${fullName}`}
        className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] px-1.5 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:bg-muted"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
        >
          {initialsOf(fullName)}
        </span>
        <span className="hidden flex-col sm:flex">
          <span className="max-w-48 truncate text-sm leading-tight font-semibold">{fullName}</span>
          <span className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] w-64 rounded-xl border bg-card p-1.5 shadow-lg"
        >
          <div className="flex flex-col items-start gap-1.5 px-2.5 py-2">
            <span className="text-sm font-semibold break-words">{fullName}</span>
            <span className="text-xs break-all text-muted-foreground">{email}</span>
            <Badge variant="primary">{ROLE_LABELS[role]}</Badge>
          </div>
          <DropdownMenu.Separator className="my-1 border-t" />
          <DropdownMenu.Item
            onSelect={() => dispatch(signOut())}
            className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
