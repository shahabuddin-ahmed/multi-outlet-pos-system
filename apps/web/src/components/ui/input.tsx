'use client';

import type { ComponentProps } from 'react';
import { useFieldControl } from '@/components/ui/field-context';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  const field = useFieldControl();

  return (
    <input
      {...field}
      className={cn(
        'flex h-10 w-full rounded-[10px] border border-input bg-card px-3 text-sm transition-colors placeholder:text-gray-400 hover:border-gray-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-red-600 aria-invalid:focus-visible:ring-red-600/30',
        className
      )}
      {...props}
    />
  );
}
