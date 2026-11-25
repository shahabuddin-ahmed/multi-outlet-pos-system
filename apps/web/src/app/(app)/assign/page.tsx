import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shared/coming-soon';

export const metadata: Metadata = { title: 'Assign menu' };

export default function AssignPage() {
  return <ComingSoon title="Assign menu" text="What each outlet sells, and at which price" />;
}
