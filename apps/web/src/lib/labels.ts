import type { OrderType, PaymentMethod, StockReason } from '@/types';

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DINE_IN: 'Dine-in',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery'
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE_BANKING: 'bKash / Nagad'
};

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  SALE: 'Sale',
  RESTOCK: 'Restock',
  WASTE: 'Waste',
  ADJUSTMENT: 'Correction',
  VOID: 'Void'
};
