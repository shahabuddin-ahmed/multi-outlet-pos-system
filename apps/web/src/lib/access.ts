import type { Route } from 'next';
import {
  ChartColumn,
  LayoutDashboard,
  ListChecks,
  Package,
  ReceiptText,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  type LucideIcon
} from 'lucide-react';
import type { UserRole } from '@/types';

// Which role sees which page. This only decides what is shown: the API checks every request itself.
export interface Page {
  href: Route;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// In menu order; a role's first page is where it lands after signing in
export const PAGES: Page[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['HQ_ADMIN'] },
  { href: '/outlets', label: 'Outlets', icon: Store, roles: ['HQ_ADMIN'] },
  { href: '/menu-items', label: 'Menu items', icon: UtensilsCrossed, roles: ['HQ_ADMIN'] },
  { href: '/assign', label: 'Assign menu', icon: ListChecks, roles: ['HQ_ADMIN'] },
  { href: '/reports', label: 'Reports', icon: ChartColumn, roles: ['HQ_ADMIN'] },
  { href: '/till', label: 'Till', icon: ShoppingCart, roles: ['OUTLET_MANAGER', 'CASHIER'] },
  { href: '/stock', label: 'Stock', icon: Package, roles: ['HQ_ADMIN', 'OUTLET_MANAGER'] },
  { href: '/sales', label: 'Sales history', icon: ReceiptText, roles: ['HQ_ADMIN', 'OUTLET_MANAGER', 'CASHIER'] }
];

export const ROLE_LABELS: Record<UserRole, string> = {
  HQ_ADMIN: 'HQ admin',
  OUTLET_MANAGER: 'Manager',
  CASHIER: 'Cashier'
};

// The page itself and everything below it, e.g. /sales and /sales/…
export const isWithin = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

export const pagesOf = (role: UserRole): Page[] => PAGES.filter((page) => page.roles.includes(role));

export const homeOf = (role: UserRole): Route => pagesOf(role)[0].href;

// A page that is not listed is closed, so a new one cannot be left open by mistake
export const canOpen = (role: UserRole, pathname: string): boolean =>
  pagesOf(role).some((page) => isWithin(pathname, page.href));
