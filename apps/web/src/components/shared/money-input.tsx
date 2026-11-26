'use client';

import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/features/settings/settings-provider';
import { cn } from '@/lib/utils';

interface MoneyInputProps extends ComponentProps<'input'> {
  // For the box around the input, e.g. its width
  wrapperClassName?: string;
}

// An amount typed as text, with the currency sign in front. Reading it is left to lib/price-input.
export function MoneyInput({ className, wrapperClassName, ...props }: MoneyInputProps) {
  const { currencySymbol } = useSettings();

  return (
    <div className={cn('relative', wrapperClassName)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
      >
        {currencySymbol}
      </span>
      <Input inputMode="decimal" autoComplete="off" className={cn('pl-8 tabular-nums', className)} {...props} />
    </div>
  );
}
