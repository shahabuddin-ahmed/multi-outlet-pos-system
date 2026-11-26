'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Dialog as DialogParts } from 'radix-ui';
import { Brand } from '@/components/layout/brand';
import { NavLinks } from '@/components/layout/nav-links';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

// Where the sidebar takes over
const SIDEBAR_SCREEN = '(min-width: 1024px)';

// The menu of a phone or tablet: slides over the page and closes once a page is picked
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const wide = useMediaQuery(SIDEBAR_SCREEN);

  return (
    <DialogParts.Root open={open && !wide} onOpenChange={setOpen}>
      <DialogParts.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="shrink-0 lg:hidden">
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </DialogParts.Trigger>
      <DialogParts.Portal>
        <DialogParts.Overlay className="drawer-overlay fixed inset-0 z-40 bg-gray-900/40" />
        <DialogParts.Content
          aria-describedby={undefined}
          className="drawer fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-0.5 overflow-y-auto border-r bg-card px-3 py-4 shadow-xl"
        >
          <DialogParts.Title className="sr-only">Menu</DialogParts.Title>
          <div className="flex items-center justify-between gap-3 pb-4 pl-2.5">
            <Brand caption="HQ and outlets" />
            <DialogParts.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X aria-hidden="true" className="size-5" />
              </Button>
            </DialogParts.Close>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
        </DialogParts.Content>
      </DialogParts.Portal>
    </DialogParts.Root>
  );
}
