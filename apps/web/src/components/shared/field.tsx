'use client';

import { useId, type PropsWithChildren } from 'react';
import { CircleAlert } from 'lucide-react';
import { FieldContext } from '@/components/ui/field-context';

interface FieldProps extends PropsWithChildren {
  label: string;
  hint?: string;
  // What is wrong with the value, shown under the control
  error?: string;
}

// A labelled form control. The control inside takes the label, hint and error from here.
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="-mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldContext value={{ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }}>
        {children}
      </FieldContext>
      {/* Always present, so a screen reader announces the message when it appears */}
      <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-700 empty:hidden">
        {error ? (
          <>
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            {error}
          </>
        ) : null}
      </p>
    </div>
  );
}
