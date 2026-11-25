import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 max-w-full rounded-[10px] border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}
