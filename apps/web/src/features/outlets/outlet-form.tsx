'use client';

import { useState } from 'react';
import { Field } from '@/components/shared/field';
import { FormDialog } from '@/components/shared/form-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { api } from '@/lib/api';
import type { Outlet, OutletInput } from '@/types';

// The same shape the API accepts
const CODE_PATTERN = /^[A-Z0-9]{2,10}$/;

interface OutletFormProps {
  // Left out for a new outlet
  outlet?: Outlet;
  onSaved: () => void;
  onClose: () => void;
}

export function OutletForm({ outlet, onSaved, onClose }: OutletFormProps) {
  const [code, setCode] = useState(outlet?.code ?? '');
  const [values, setValues] = useState<OutletInput>({
    name: outlet?.name ?? '',
    address: outlet?.address ?? '',
    phone: outlet?.phone ?? '',
    isActive: outlet?.isActive ?? true
  });
  const set = (changes: Partial<OutletInput>) => setValues((current) => ({ ...current, ...changes }));
  const { errors, check, clear } = useFieldErrors<'code' | 'name'>();

  const validate = () =>
    check({
      code: outlet || CODE_PATTERN.test(code) ? '' : 'Enter 2 to 10 capital letters or digits',
      name: values.name.trim() ? '' : 'Enter the outlet name'
    });

  const save = async () => {
    await (outlet ? api.updateOutlet(outlet.id, values) : api.createOutlet({ ...values, code }));
    onSaved();
  };

  return (
    <FormDialog title={outlet ? 'Edit outlet' : 'New outlet'} validate={validate} onSave={save} onClose={onClose}>
      <Field
        label="Code"
        hint="2 to 10 capital letters or digits. It starts every receipt number and cannot change."
        error={errors.code}
      >
        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            clear('code');
          }}
          disabled={Boolean(outlet)}
          maxLength={10}
          required
        />
      </Field>
      <Field label="Name" error={errors.name}>
        <Input
          value={values.name}
          onChange={(event) => {
            set({ name: event.target.value });
            clear('name');
          }}
          maxLength={100}
          required
        />
      </Field>
      <Field label="Address">
        <Input value={values.address} onChange={(event) => set({ address: event.target.value })} maxLength={200} />
      </Field>
      <Field label="Phone">
        <Input value={values.phone} onChange={(event) => set({ phone: event.target.value })} maxLength={30} />
      </Field>
      <Switch
        aria-label="Active"
        checked={values.isActive}
        onChange={(event) => set({ isActive: event.target.checked })}
        onText="Active (can sell)"
        offText="Off (cannot sell)"
      />
      {outlet && (
        <p className="text-xs text-muted-foreground">Old receipts keep the name and address they were printed with.</p>
      )}
    </FormDialog>
  );
}
