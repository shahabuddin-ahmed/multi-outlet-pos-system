import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shared/coming-soon';

export const metadata: Metadata = { title: 'Reports' };

export default function ReportsPage() {
  return <ComingSoon title="Reports" text="Revenue by outlet and top items" />;
}
