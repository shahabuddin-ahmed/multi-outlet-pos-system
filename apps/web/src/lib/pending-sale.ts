import type { PendingSale } from '@/stores/slices/cart-slice';

// A sale that was sent and not yet answered. It is written down before it is sent, so a reload, a closed
// browser or a power cut cannot lose its retry key. It holds the order, never the login.
const keyOf = (userId: string) => `pos.pending-sale.${userId}`;

export function readPendingSale(userId: string): PendingSale | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(keyOf(userId)) ?? 'null') as PendingSale | null;
    return stored?.key && stored.request && stored.draft ? stored : null;
  } catch {
    return null;
  }
}

export function savePendingSale(userId: string, pending: PendingSale): void {
  try {
    window.localStorage.setItem(keyOf(userId), JSON.stringify(pending));
  } catch {
    // Storage is blocked: the sale is then remembered only while the page stays open
  }
}

// Removes it only if it is still the same sale (another tab may have written a newer one)
export function forgetPendingSale(userId: string, saleKey: string): void {
  if (readPendingSale(userId)?.key !== saleKey) {
    return;
  }
  try {
    window.localStorage.removeItem(keyOf(userId));
  } catch {
    // Nothing was stored
  }
}
