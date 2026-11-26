'use client';

import type { ComponentProps } from 'react';
import { Popover as PopoverParts } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Popover = PopoverParts.Root;
export const PopoverTrigger = PopoverParts.Trigger;

// A panel beside its button. It stays on the screen and scrolls when the screen is too small for it.
export function PopoverContent({ className, ...props }: ComponentProps<typeof PopoverParts.Content>) {
  return (
    <PopoverParts.Portal>
      <PopoverParts.Content
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          'z-[60] max-h-[var(--radix-popover-content-available-height)] max-w-[calc(100vw-1.5rem)] overflow-auto rounded-xl border bg-card shadow-lg',
          className
        )}
        {...props}
      />
    </PopoverParts.Portal>
  );
}
