'use client';

import { FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Post } from '@/types';

export function PostTable({ posts, onChanged }: { posts: Post[]; onChanged: () => void }) {
  const remove = async (post: Post) => {
    try {
      await api.deletePost(post.id);
      toast.success('Post deleted');
      onChanged();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (posts.length === 0) {
    return (
      <Card>
        <EmptyState icon={FileText} title="No posts yet" text="Add the first one with the form." />
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Author</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Added</th>
            <th className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{post.title}</td>
              <td className="px-4 py-3">{post.author}</td>
              <td className="px-4 py-3">
                <Badge variant={post.published ? 'ok' : 'default'}>{post.published ? 'Published' : 'Draft'}</Badge>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(post.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(post)} aria-label={`Delete ${post.title}`}>
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
