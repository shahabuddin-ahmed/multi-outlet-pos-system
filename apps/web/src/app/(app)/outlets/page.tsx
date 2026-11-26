import type { Metadata } from 'next';
import { OutletsView } from '@/features/outlets/outlets-view';

export const metadata: Metadata = { title: 'Outlets' };

export default function OutletsPage() {
  return <OutletsView />;
}
