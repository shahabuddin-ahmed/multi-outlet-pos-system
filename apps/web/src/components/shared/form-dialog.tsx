'use client';

import { useState, type FormEvent, type PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { errorMessage } from '@/lib/api';

interface FormDialogProps extends PropsWithChildren {
  title: string;
  // False keeps the form from being sent: the fields then show what is wrong
  validate: () => boolean;
  // Throws to keep the form open and show the API's answer
  onSave: () => Promise<void>;
  onClose: () => void;
}

// A form in a dialog that saves once at a time and shows what went wrong
export function FormDialog({ title, validate, onSave, onClose, children }: FormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave();
      toast.success('Saved');
      onClose();
    } catch (failure) {
      setError(errorMessage(failure));
      setSaving(false);
    }
  };

  return (
    <Dialog title={title} onClose={onClose}>
      {/* The app checks the fields itself, so the browser's own pop-ups stay away */}
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        {children}
        <p role="alert" className="text-sm text-red-700 empty:hidden">
          {error}
        </p>
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
