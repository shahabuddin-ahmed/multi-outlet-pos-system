'use client';

import { useState, type FormEvent, type PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { errorMessage } from '@/lib/api';

interface FormDialogProps extends PropsWithChildren {
  title: string;
  // Throws to keep the form open and show why: an Error of its own, or the API's answer
  onSave: () => Promise<void>;
  onClose: () => void;
}

// An input the form itself refuses, before anything is sent
export class FormError extends Error {}

// A form in a dialog that saves once at a time and shows what went wrong
export function FormDialog({ title, onSave, onClose, children }: FormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave();
      toast.success('Saved');
      onClose();
    } catch (failure) {
      setError(failure instanceof FormError ? failure.message : errorMessage(failure));
      setSaving(false);
    }
  };

  return (
    <Dialog title={title} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {children}
        <p role="alert" className="text-sm text-red-700 empty:hidden">
          {error}
        </p>
        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
