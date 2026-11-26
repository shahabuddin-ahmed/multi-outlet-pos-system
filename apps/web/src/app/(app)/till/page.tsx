import type { Metadata } from 'next';
import { TillView } from '@/features/till/till-view';

export const metadata: Metadata = { title: 'Till' };

export default function TillPage() {
  return <TillView />;
}
