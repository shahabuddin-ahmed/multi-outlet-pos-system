'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { SearchInput } from '@/components/shared/search-input';
import { PageHeader } from '@/components/shared/page-header';
import { PageState } from '@/components/shared/page-state';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { ReceiptPanel } from '@/features/receipt/receipt-panel';
import { useUser } from '@/features/session/use-user';
import { useSettings } from '@/features/settings/settings-provider';
import { CartPanel } from '@/features/till/cart-panel';
import { MenuGrid } from '@/features/till/menu-grid';
import { useApiData } from '@/hooks/use-api-data';
import { useAppDispatch, useAppSelector } from '@/hooks/use-app-redux';
import { api } from '@/lib/api';
import { estimateTotals } from '@/lib/estimate';
import { fetchAll } from '@/lib/fetch-all';
import { cn } from '@/lib/utils';
import { CART_LINES_MAX, isLocked, itemAdded, receiptClosed, restorePendingSale } from '@/stores/slices/cart-slice';
import type { OutletMenuItem } from '@/types';

export function TillView() {
  const { fullName, outlet } = useUser();
  const outletId = outlet!.id;
  const { money, vatBps } = useSettings();
  const dispatch = useAppDispatch();
  const { draft, checkout, answers } = useAppSelector((state) => state.cart);
  const [search, setSearch] = useState('');
  // On a narrow screen the cart is a sheet over the items
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    dispatch(restorePendingSale());
  }, [dispatch]);

  // Loaded again after every answer to a sale: stock and prices have changed or were out of date
  const loadMenu = useMemo(() => {
    void answers;
    return () => fetchAll((query) => api.outletMenu(outletId, query));
  }, [outletId, answers]);
  const menu = useApiData(loadMenu);

  const wanted = search.trim().toLowerCase();
  const shown = menu.data?.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(wanted)) ?? [];
  const count = draft.lines.reduce((sum, line) => sum + line.quantity, 0);
  const inCart = new Map(draft.lines.map((line) => [line.menuItemId, line.quantity]));
  const total = estimateTotals(draft.lines, draft.vatBps ?? vatBps).totalCents;

  const add = (item: OutletMenuItem) => {
    const known = draft.lines.some((line) => line.menuItemId === item.menuItemId);
    if (!known && draft.lines.length >= CART_LINES_MAX) {
      toast.error(`A sale can have at most ${CART_LINES_MAX} different items`);
      return;
    }
    dispatch(itemAdded({ menuItemId: item.menuItemId, name: item.name, unitPriceCents: item.effectivePriceCents }));
  };

  return (
    <>
      {/* The title is above the items only, so that the cart gets the height of the screen */}
      <div className="grid items-start gap-4 min-[720px]:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="flex flex-col gap-6">
          <PageHeader title="Till" text={`${outlet!.name} · ${fullName}`}>
            <SearchInput label="Search items" value={search} onChange={setSearch} />
          </PageHeader>
          {!menu.data && (
            <PageState message={menu.error || 'Loading…'} error={Boolean(menu.error)} onRetry={menu.reload} />
          )}
          {menu.data && shown.length === 0 && (
            <Card>
              <EmptyState
                icon={Search}
                title="No items to sell"
                text={
                  wanted ? 'Nothing matches your search.' : 'Head office has not assigned items to this outlet yet.'
                }
              />
            </Card>
          )}
          <MenuGrid items={shown} inCart={inCart} money={money} disabled={isLocked(checkout)} onAdd={add} />
        </div>

        {/* Shown even when the menu cannot be loaded: an unconfirmed sale must stay in reach */}
        <Card
          className={cn(
            // Less the bars above the page (taller below 1024px, where the menu is on top), so it fits the screen
            'flex-col min-[720px]:sticky min-[720px]:top-3 min-[720px]:flex min-[720px]:max-h-[calc(100dvh-15rem)] lg:max-h-[calc(100dvh-7rem)]',
            cartOpen
              ? 'max-[719px]:fixed max-[719px]:inset-0 max-[719px]:z-30 max-[719px]:flex max-[719px]:rounded-none'
              : 'max-[719px]:hidden'
          )}
        >
          <div className="px-4 pt-3 min-[720px]:hidden">
            <Button variant="outline" size="sm" onClick={() => setCartOpen(false)}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to items
            </Button>
          </div>
          <CartPanel />
        </Card>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t bg-card px-4 py-2.5 min-[720px]:hidden">
        <span className="text-sm">
          <strong>
            {count} {count === 1 ? 'item' : 'items'}
          </strong>{' '}
          · {money(total)}
        </span>
        <Button onClick={() => setCartOpen(true)}>View cart</Button>
      </div>

      {checkout.status === 'done' && (
        <Dialog title={`Receipt ${checkout.receipt.receiptCode}`} onClose={() => dispatch(receiptClosed())}>
          <Banner>Sale saved. Stock was updated.</Banner>
          <ReceiptPanel receipt={checkout.receipt} fresh>
            <Button
              onClick={() => {
                dispatch(receiptClosed());
                setCartOpen(false);
              }}
            >
              New sale
            </Button>
          </ReceiptPanel>
        </Dialog>
      )}
    </>
  );
}
