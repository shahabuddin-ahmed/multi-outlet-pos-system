'use client';

import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Select as SelectParts } from 'radix-ui';
import { useFieldControl } from '@/components/ui/field-context';
import { cn } from '@/lib/utils';

export interface SelectOption<T extends string> {
  // Never empty: an empty value means "nothing chosen" to the list underneath
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // Names the control when no Field around it does
  label?: string;
  disabled?: boolean;
  className?: string;
}

const SCROLL_BUTTON = 'flex h-7 items-center justify-center text-muted-foreground';

// A list of choices drawn by the app, with the keyboard behaviour of a native one (arrows, typing, Escape)
export function Select<T extends string>({ options, value, onChange, label, disabled, className }: SelectProps<T>) {
  const field = useFieldControl();

  return (
    <SelectParts.Root value={value} onValueChange={(next) => onChange(next as T)} disabled={disabled}>
      <SelectParts.Trigger
        {...field}
        aria-label={label}
        className={cn(
          'group inline-flex h-10 max-w-full min-w-44 items-center justify-between gap-2 rounded-[10px] border border-input bg-card pr-2.5 pl-3 text-left text-sm font-medium transition-colors hover:border-gray-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground data-[state=open]:border-primary',
          className
        )}
      >
        <span className="truncate">
          <SelectParts.Value />
        </span>
        <SelectParts.Icon>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        </SelectParts.Icon>
      </SelectParts.Trigger>
      <SelectParts.Portal>
        <SelectParts.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border bg-card shadow-lg"
        >
          <SelectParts.ScrollUpButton className={SCROLL_BUTTON}>
            <ChevronUp aria-hidden="true" className="size-4" />
          </SelectParts.ScrollUpButton>
          <SelectParts.Viewport className="p-1">
            {options.map((option) => (
              <SelectParts.Item
                key={option.value}
                value={option.value}
                className="relative flex min-h-10 cursor-pointer items-center rounded-lg pr-10 pl-3 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:font-semibold"
              >
                <SelectParts.ItemText>{option.label}</SelectParts.ItemText>
                <SelectParts.ItemIndicator className="absolute right-3">
                  <Check aria-hidden="true" className="size-4 text-primary" />
                </SelectParts.ItemIndicator>
              </SelectParts.Item>
            ))}
          </SelectParts.Viewport>
          <SelectParts.ScrollDownButton className={SCROLL_BUTTON}>
            <ChevronDown aria-hidden="true" className="size-4" />
          </SelectParts.ScrollDownButton>
        </SelectParts.Content>
      </SelectParts.Portal>
    </SelectParts.Root>
  );
}
