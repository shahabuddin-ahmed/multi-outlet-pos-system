import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked: boolean;
  // The state written next to the switch, so it never depends on colour alone
  onText?: string;
  offText?: string;
}

// A real checkbox drawn as a switch: it works with the keyboard and screen readers as it is
export function Switch({ checked, onText = 'On', offText = 'Off', className, disabled, ...props }: SwitchProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2', disabled && 'cursor-wait opacity-60')}>
      <input
        type="checkbox"
        role="switch"
        className={cn('peer sr-only', className)}
        checked={checked}
        disabled={disabled}
        {...props}
      />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 motion-reduce:transition-none motion-reduce:after:transition-none"
      />
      <span aria-hidden="true" className="text-sm whitespace-nowrap text-gray-700">
        {checked ? onText : offText}
      </span>
    </label>
  );
}
