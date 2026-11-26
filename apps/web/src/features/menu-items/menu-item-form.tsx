'use client';

import { useState } from 'react';
import { Field } from '@/components/shared/field';
import { FormDialog } from '@/components/shared/form-dialog';
import { MoneyInput } from '@/components/shared/money-input';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { api } from '@/lib/api';
import { parsePrice, PRICE_HINT, priceText } from '@/lib/price-input';
import type { MenuItem } from '@/types';

// The same shape the API accepts
const SKU_PATTERN = /^[A-Za-z0-9-]{2,30}$/;

interface MenuItemFormProps {
  // Left out for a new item
  item?: MenuItem;
  onSaved: () => void;
  onClose: () => void;
}

export function MenuItemForm({ item, onSaved, onClose }: MenuItemFormProps) {
  const [sku, setSku] = useState(item?.sku ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? priceText(item.basePriceCents) : '');
  const [isActive, setActive] = useState(item?.isActive ?? true);

  const { errors, check, clear } = useFieldErrors<'sku' | 'name' | 'price'>();

  const validate = () =>
    check({
      sku: item || SKU_PATTERN.test(sku.trim()) ? '' : 'Enter 2 to 30 letters, digits or hyphens',
      name: name.trim() ? '' : 'Enter the item name',
      price: parsePrice(price) === null ? PRICE_HINT : ''
    });

  const save = async () => {
    const values = { name, basePriceCents: parsePrice(price)!, isActive };
    await (item ? api.updateMenuItem(item.id, values) : api.createMenuItem({ ...values, sku }));
    onSaved();
  };

  return (
    <FormDialog title={item ? 'Edit menu item' : 'New menu item'} validate={validate} onSave={save} onClose={onClose}>
      <Field label="SKU" hint="2 to 30 letters, digits or hyphens. It cannot change later." error={errors.sku}>
        <Input
          value={sku}
          onChange={(event) => {
            setSku(event.target.value);
            clear('sku');
          }}
          disabled={Boolean(item)}
          maxLength={30}
          required
        />
      </Field>
      <Field label="Name" error={errors.name}>
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clear('name');
          }}
          maxLength={100}
          required
        />
      </Field>
      <Field
        label="Base price"
        hint="0 to 100,000.00; 0 means free. Outlets without their own price follow this one."
        error={errors.price}
      >
        <MoneyInput
          value={price}
          onChange={(event) => {
            setPrice(event.target.value);
            clear('price');
          }}
          placeholder="0.00"
          required
        />
      </Field>
      <Switch
        aria-label="Active"
        checked={isActive}
        onChange={(event) => setActive(event.target.checked)}
        onText="Active"
        offText="Off (no outlet can sell it)"
      />
    </FormDialog>
  );
}
