'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import type { DateRange as CalendarRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSettings } from '@/features/settings/settings-provider';
import { useMediaQuery } from '@/hooks/use-media-query';
import { PRESET_LABELS, presetRange, type DateRange, type Preset } from '@/lib/date-range';
import { dateOf, dayOf, todayIn, type Day } from '@/lib/day';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  // What the days are for, e.g. "Period"
  label: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
  // The edge of the button the panel lines up with
  align?: 'start' | 'end';
}

// A range of business days: a ready-made one, or two days picked in a calendar. Days after today cannot be
// picked, and the first day is never after the last. It opens beside its button, and on a phone in a dialog,
// where the whole of it fits.
export function DateRangePicker({ label, value, onChange, align = 'end' }: DateRangePickerProps) {
  const { timezone, day } = useSettings();
  const [open, setOpen] = useState(false);
  // The days picked in the calendar, used only when "Apply" is pressed
  const [draft, setDraft] = useState<CalendarRange>();
  const twoMonths = useMediaQuery('(min-width: 768px)');
  const phone = useMediaQuery('(max-width: 639px)');

  const today = todayIn(timezone);
  const lastDay = dateOf(today);
  const shownLast = value.to ? dateOf(value.to) : lastDay;

  const span = (from: Day, to: Day) => (from === to ? day(from) : `${day(from)} – ${day(to)}`);
  const days = value.from && value.to ? span(value.from, value.to) : '';
  const name = value.preset === 'custom' ? days : PRESET_LABELS[value.preset];
  const picked = draft?.from ? span(dayOf(draft.from), dayOf(draft.to ?? draft.from)) : '';

  const show = (next: boolean) => {
    if (next) {
      setDraft(value.from && value.to ? { from: dateOf(value.from), to: dateOf(value.to) } : undefined);
    }
    setOpen(next);
  };
  const choose = (range: DateRange) => {
    onChange(range);
    setOpen(false);
  };
  const apply = () => {
    if (draft?.from) {
      choose({ preset: 'custom', from: dayOf(draft.from), to: dayOf(draft.to ?? draft.from) });
    }
  };

  // A click is handled by the popover itself; the dialog has to be told to open
  const trigger = (
    <Button
      variant="outline"
      aria-label={`${label}: ${name}`}
      aria-haspopup="dialog"
      className="h-10 max-w-full justify-start px-3 font-medium"
      onClick={phone ? () => show(true) : undefined}
    >
      <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{name}</span>
      {value.preset !== 'custom' && days && (
        <span className="hidden font-normal text-muted-foreground xl:inline">{days}</span>
      )}
      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );

  const panel = (
    <div className="flex flex-col sm:flex-row">
      <ul className="flex flex-wrap gap-1.5 border-b pb-3 sm:w-36 sm:flex-col sm:flex-nowrap sm:gap-1 sm:border-r sm:border-b-0 sm:p-2">
        {(Object.keys(PRESET_LABELS) as Preset[]).map((preset) => (
          <li key={preset}>
            <button
              type="button"
              aria-pressed={value.preset === preset}
              onClick={() => choose(presetRange(preset, today))}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none max-sm:border',
                value.preset === preset && 'bg-accent font-semibold text-accent-foreground hover:bg-accent'
              )}
            >
              {PRESET_LABELS[preset]}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 pt-3 max-sm:items-center sm:p-3">
        <Calendar
          mode="range"
          // A click after a finished range starts a new one
          resetOnSelect
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={twoMonths ? 2 : 1}
          defaultMonth={new Date(shownLast.getFullYear(), shownLast.getMonth() - (twoMonths ? 1 : 0), 1)}
          endMonth={lastDay}
          today={lastDay}
          disabled={{ after: lastDay }}
          autoFocus
        />
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-sm">
            <span className="block font-medium">{picked || 'Pick the first and the last day'}</span>
            <span className="block text-xs text-muted-foreground">Days follow {timezone} time</span>
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draft?.from} onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (phone) {
    return (
      <>
        {trigger}
        {open && (
          <Dialog title={label} onClose={() => setOpen(false)}>
            {panel}
          </Dialog>
        )}
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={show}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} aria-label={label}>
        {panel}
      </PopoverContent>
    </Popover>
  );
}
