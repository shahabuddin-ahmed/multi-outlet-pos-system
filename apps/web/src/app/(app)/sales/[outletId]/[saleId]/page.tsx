import type { Metadata } from 'next';
import { ReceiptView } from '@/features/receipt/receipt-view';

export const metadata: Metadata = { title: 'Receipt' };

interface ReceiptPageProps {
  params: Promise<{ outletId: string; saleId: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { outletId, saleId } = await params;
  return <ReceiptView outletId={outletId} saleId={saleId} />;
}
