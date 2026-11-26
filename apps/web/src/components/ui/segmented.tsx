import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string> {
  label: string;
  options: Record<T, string>;
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

// A choice of a few options, all visible: one press each
export function Segmented<T extends string>({ label, options, value, disabled, onChange }: SegmentedProps<T>) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</legend>
      <div className="flex overflow-hidden rounded-[10px] border border-input">
        {(Object.entries(options) as [T, string][]).map(([option, text]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              'min-h-10 flex-1 bg-card px-2 text-[13px] font-semibold text-gray-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset disabled:opacity-55',
              value === option && 'bg-primary text-primary-foreground'
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
