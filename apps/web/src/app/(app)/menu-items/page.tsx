import type { Metadata } from 'next';
import { MenuItemsView } from '@/features/menu-items/menu-items-view';

export const metadata: Metadata = { title: 'Menu items' };

export default function MenuItemsPage() {
  return <MenuItemsView />;
}
