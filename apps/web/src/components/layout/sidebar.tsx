'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { House, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Each feature adds its own section here (HQ: menu, outlets · Outlet: POS, inventory · Reports)
const sections: NavSection[] = [
  {
    label: 'Workspace',
    items: [{ href: '/', label: 'Overview', icon: House }]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-0.5 border-b bg-card px-3 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-b-0">
      <Link href="/" className="flex items-center gap-2.5 px-2.5 pb-4">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-primary text-[15px] font-bold text-primary-foreground shadow-sm"
        >
          P
        </span>
        <span className="flex flex-col">
          <span className="text-[15px] font-bold text-foreground">POS</span>
          <span className="text-xs text-muted-foreground">HQ and outlets</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex flex-wrap gap-0.5 lg:flex-col">
        {sections.map((section) => (
          <div key={section.label} className="contents">
            <span className="hidden px-3 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase lg:block">
              {section.label}
            </span>
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-muted hover:text-foreground',
                    active &&
                      'bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon
                    aria-hidden="true"
                    className={cn(
                      'size-4 shrink-0 text-gray-500 group-hover:text-foreground',
                      active && 'text-primary group-hover:text-primary'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
