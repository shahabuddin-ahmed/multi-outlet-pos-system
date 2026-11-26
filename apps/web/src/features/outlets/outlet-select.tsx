import { Select } from '@/components/ui/select';
import type { Outlet } from '@/types';

// The list underneath cannot use an empty value for "all outlets"
const ALL = 'all';

interface OutletSelectProps {
  outlets: Pick<Outlet, 'id' | 'name' | 'code'>[];
  // Empty for all outlets
  value: string;
  withAll?: boolean;
  onChange: (outletId: string) => void;
}

export function OutletSelect({ outlets, value, withAll, onChange }: OutletSelectProps) {
  const options = outlets.map((outlet) => ({ value: outlet.id, label: `${outlet.name} (${outlet.code})` }));

  return (
    <Select
      label="Outlet"
      options={withAll ? [{ value: ALL, label: 'All outlets' }, ...options] : options}
      value={value || ALL}
      onChange={(next) => onChange(next === ALL ? '' : next)}
    />
  );
}
