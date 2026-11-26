import { useSettings } from '@/features/settings/settings-provider';
import { cashSuggestions } from '@/lib/cash';
import { cn } from '@/lib/utils';

const CENTS_PER_UNIT = 100;

interface QuickCashProps {
  totalCents: number;
  // The amount now in the field, if it is one
  receivedCents: number | null;
  disabled: boolean;
  onPick: (cents: number) => void;
}

export function QuickCash({ totalCents, receivedCents, disabled, onPick }: QuickCashProps) {
  const { count, currencySymbol } = useSettings();

  return (
    <div role="group" aria-label="Quick cash amounts" className="flex gap-2">
      {cashSuggestions(totalCents).map((cents, index) => (
        <button
          key={cents}
          type="button"
          disabled={disabled}
          aria-pressed={receivedCents === cents}
          onClick={() => onPick(cents)}
          className={cn(
            'min-h-10 flex-1 rounded-[10px] border border-input bg-card px-2 text-[13px] font-semibold tabular-nums transition-colors hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55',
            receivedCents === cents && 'border-primary bg-accent text-accent-foreground hover:border-primary'
          )}
        >
          {/* The first is the total itself; the rest are whole notes */}
          {index === 0 ? 'Exact' : `${currencySymbol}${count(cents / CENTS_PER_UNIT)}`}
        </button>
      ))}
    </div>
  );
}
