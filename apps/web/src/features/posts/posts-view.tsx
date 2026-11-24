'use client';

import { useCallback, useState } from 'react';
import { PageState } from '@/components/shared/page-state';
import { Pager } from '@/components/shared/pager';
import { PostForm } from '@/features/posts/post-form';
import { PostTable } from '@/features/posts/post-table';
import { useApiData } from '@/hooks/use-api-data';
import { api } from '@/lib/api';

const PAGE_SIZE = 10;

// Sample screen that proves the web app, the API and the database work together. Removed with the posts feature.
export function PostsView() {
  const [offset, setOffset] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // A new reloadKey makes a new load function, so useApiData fetches again
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => api.getPosts(offset, PAGE_SIZE), [offset, reloadKey]);
  const { data, error, loading } = useApiData(load);
  const reload = () => setReloadKey((key) => key + 1);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        {error && <PageState message={error} error />}
        {!data && loading && <PageState message="Loading posts…" />}
        {data && (
          <>
            <PostTable posts={data.data} onChanged={reload} />
            <Pager offset={data.offset} limit={data.limit} total={data.total} onChange={setOffset} />
          </>
        )}
      </div>
      <PostForm onCreated={reload} />
    </div>
  );
}
