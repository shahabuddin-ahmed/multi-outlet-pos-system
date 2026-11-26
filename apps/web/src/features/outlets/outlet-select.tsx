import { Select } from '@/components/ui/select';
import type { Outlet } from '@/types';

interface OutletSelectProps {
  outlets: Pick<Outlet, 'id' | 'name' | 'code'>[];
  // Empty for all outlets
  value: string;
  withAll?: boolean;
  onChange: (outletId: string) => void;
}

export function OutletSelect({ outlets, value, withAll, onChange }: OutletSelectProps) {
  return (
    <Select aria-label="Outlet" value={value} onChange={(event) => onChange(event.target.value)}>
      {withAll && <option value="">All outlets</option>}
      {outlets.map((outlet) => (
        <option key={outlet.id} value={outlet.id}>
          {outlet.name} ({outlet.code})
        </option>
      ))}
    </Select>
  );
}
