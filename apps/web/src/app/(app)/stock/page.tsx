import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shared/coming-soon';

export const metadata: Metadata = { title: 'Stock' };

export default function StockPage() {
  return <ComingSoon title="Stock" text="Stock of each item at an outlet" />;
}
