'use client';

import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';
import { Dialog as DialogParts } from 'radix-ui';
import { cn } from '@/lib/utils';

interface DialogProps extends PropsWithChildren {
  title: string;
  // Room for a table
  wide?: boolean;
  onClose: () => void;
}

// Open as long as it is rendered. Focus stays inside, and Escape or a click outside closes it.
export function Dialog({ title, wide, onClose, children }: DialogProps) {
  return (
    <DialogParts.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogParts.Portal>
        <DialogParts.Overlay className="fixed inset-0 z-40 bg-gray-900/40" />
        <DialogParts.Content
          aria-describedby={undefined}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-5 shadow-xl',
            wide ? 'max-w-3xl' : 'max-w-md'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <DialogParts.Title className="text-base font-semibold">{title}</DialogParts.Title>
            <DialogParts.Close
              aria-label="Close"
              className="rounded-lg p-1 text-gray-500 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X aria-hidden="true" className="size-4" />
            </DialogParts.Close>
          </div>
          {children}
        </DialogParts.Content>
      </DialogParts.Portal>
    </DialogParts.Root>
  );
}
