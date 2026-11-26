import type { PropsWithChildren } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const bannerVariants = cva('rounded-[10px] px-3 py-2.5 text-sm font-medium', {
  variants: {
    variant: {
      info: 'bg-indigo-50 text-indigo-800',
      warn: 'bg-amber-50 text-amber-800',
      error: 'bg-red-50 text-red-800'
    }
  },
  defaultVariants: { variant: 'info' }
});

type BannerProps = PropsWithChildren<VariantProps<typeof bannerVariants>>;

// A message that stays until its cause is gone. Warnings and errors are announced.
export function Banner({ variant, children }: BannerProps) {
  return (
    <div role={variant === 'info' ? 'status' : 'alert'} className={cn(bannerVariants({ variant }))}>
      {children}
    </div>
  );
}
