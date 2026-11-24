'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, errorMessage } from '@/lib/api';

export function PostForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createPost({ title, content });
      setTitle('');
      setContent('');
      toast.success('Post added');
      onCreated();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Title
            <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Content
            <Textarea value={content} onChange={(event) => setContent(event.target.value)} required />
          </label>
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
