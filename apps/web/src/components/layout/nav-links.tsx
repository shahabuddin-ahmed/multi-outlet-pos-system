'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/features/session/use-user';
import { isWithin, pagesOf } from '@/lib/access';
import { cn } from '@/lib/utils';

// The pages of this person's role, in the sidebar and in the slide-out menu
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useUser();
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      <span className="px-3 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {role === 'HQ_ADMIN' ? 'Head office' : 'Outlet'}
      </span>
      {pagesOf(role).map((page) => {
        const active = isWithin(pathname, page.href);
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:py-2',
              active && 'bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <page.icon
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0 text-gray-500 group-hover:text-foreground',
                active && 'text-primary group-hover:text-primary'
              )}
            />
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}
