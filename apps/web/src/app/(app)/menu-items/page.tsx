import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shared/coming-soon';

export const metadata: Metadata = { title: 'Menu items' };

export default function MenuItemsPage() {
  return <ComingSoon title="Menu items" text="The master menu of head office" />;
}
