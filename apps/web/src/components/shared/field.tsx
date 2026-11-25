import type { PropsWithChildren } from 'react';

interface FieldProps extends PropsWithChildren {
  label: string;
  hint?: string;
}

// A labelled form control. The label wraps the control, so no ids are needed.
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span>
        {label}
        {hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
