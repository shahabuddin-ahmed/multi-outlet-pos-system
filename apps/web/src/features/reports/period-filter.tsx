import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PERIOD_LABELS, type PeriodChoice, type usePeriod } from '@/features/reports/use-period';
import { useSettings } from '@/features/settings/settings-provider';

const DAY_FIELDS = [
  { field: 'from', label: 'From' },
  { field: 'to', label: 'To' }
] as const;

export function PeriodFilter({ period }: { period: ReturnType<typeof usePeriod> }) {
  const { timezone } = useSettings();

  return (
    <>
      <Select
        aria-label="Period"
        value={period.choice}
        onChange={(event) => period.setChoice(event.target.value as PeriodChoice)}
      >
        {Object.entries(PERIOD_LABELS).map(([choice, label]) => (
          <option key={choice} value={choice}>
            {label}
          </option>
        ))}
      </Select>
      {period.choice === 'custom' &&
        DAY_FIELDS.map(({ field, label }) => (
          <label key={field} className="flex items-center gap-2 text-sm text-muted-foreground">
            {label}
            <Input
              type="date"
              className="w-auto"
              value={period.days[field]}
              onChange={(event) => period.setDays({ ...period.days, [field]: event.target.value })}
            />
          </label>
        ))}
      <span className="text-xs text-muted-foreground">Days follow {timezone} time</span>
    </>
  );
}
