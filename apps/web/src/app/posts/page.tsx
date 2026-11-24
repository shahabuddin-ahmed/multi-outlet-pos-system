import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';
import { PostsView } from '@/features/posts/posts-view';

export const metadata: Metadata = { title: 'Sample posts' };

export default function PostsPage() {
  return (
    <AppShell>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Sample posts</h1>
        <p className="text-sm text-muted-foreground">
          A placeholder that shows the web app, the API and the database working together.
        </p>
      </header>
      <PostsView />
    </AppShell>
  );
}
