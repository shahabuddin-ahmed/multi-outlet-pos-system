'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from '@/components/layout/brand';
import { useUser } from '@/features/session/use-user';
import { isWithin, pagesOf } from '@/lib/access';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { role } = useUser();
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-0.5 border-b bg-card px-3 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-b-0">
      <Link href="/" className="self-start px-2.5 pb-4">
        <Brand caption="HQ and outlets" />
      </Link>

      <nav aria-label="Main" className="flex flex-wrap gap-0.5 lg:flex-col">
        <span className="hidden px-3 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase lg:block">
          {role === 'HQ_ADMIN' ? 'Head office' : 'Outlet'}
        </span>
        {pagesOf(role).map((page) => {
          const active = isWithin(pathname, page.href);
          return (
            <Link
              key={page.href}
              href={page.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-muted hover:text-foreground',
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
    </aside>
  );
}
