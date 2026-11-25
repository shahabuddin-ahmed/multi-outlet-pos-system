import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shared/coming-soon';

export const metadata: Metadata = { title: 'Till' };

export default function TillPage() {
  return <ComingSoon title="Till" text="Make a sale" />;
}
