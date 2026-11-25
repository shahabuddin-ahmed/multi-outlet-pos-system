'use client';

import { useState } from 'react';
import { Field } from '@/components/shared/field';
import { FormDialog, FormError } from '@/components/shared/form-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/features/settings/settings-provider';
import { api } from '@/lib/api';
import { parsePrice, PRICE_HINT, priceText } from '@/lib/price-input';
import type { MenuItem } from '@/types';

interface MenuItemFormProps {
  // Left out for a new item
  item?: MenuItem;
  onSaved: () => void;
  onClose: () => void;
}

export function MenuItemForm({ item, onSaved, onClose }: MenuItemFormProps) {
  const { currency } = useSettings();
  const [sku, setSku] = useState(item?.sku ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? priceText(item.basePriceCents) : '');
  const [isActive, setActive] = useState(item?.isActive ?? true);

  const save = async () => {
    const basePriceCents = parsePrice(price);
    if (basePriceCents === null) {
      throw new FormError(PRICE_HINT);
    }
    const values = { name, basePriceCents, isActive };
    await (item ? api.updateMenuItem(item.id, values) : api.createMenuItem({ ...values, sku }));
    onSaved();
  };

  return (
    <FormDialog title={item ? 'Edit menu item' : 'New menu item'} onSave={save} onClose={onClose}>
      <Field label="SKU" hint="2 to 30 letters, digits or hyphens. It cannot change later.">
        <Input
          value={sku}
          onChange={(event) => setSku(event.target.value)}
          disabled={Boolean(item)}
          pattern="[A-Za-z0-9\-]{2,30}"
          maxLength={30}
          required
        />
      </Field>
      <Field label="Name">
        <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
      </Field>
      <Field
        label={`Base price (${currency})`}
        hint="0 to 100,000.00; 0 means free. Outlets without their own price follow this one."
      >
        <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" required />
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
