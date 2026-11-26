'use client';

import { useRef, type PropsWithChildren } from 'react';
import { EmptyState, type EmptyStateProps } from '@/components/shared/empty-state';
import { PageState } from '@/components/shared/page-state';
import { Pager } from '@/components/shared/pager';
import { ProgressBar } from '@/components/shared/refreshing';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Paged } from '@/types';

interface ListCardProps<T> extends PropsWithChildren {
  page: Paged<T> | null;
  error: string;
  // A newer page is on its way
  loading: boolean;
  // Of the table, for its placeholder
  columns: number;
  onRetry: () => void;
  onPage: (offset: number) => void;
  // Shown instead of the table when there is no row
  empty: EmptyStateProps;
}

// One paged list: loading, error, empty and the rows with their pager
export function ListCard<T>({ page, error, loading, columns, onRetry, onPage, empty, children }: ListCardProps<T>) {
  const top = useRef<HTMLDivElement>(null);

  if (error || !page) {
    return (
      <PageState
        message={error || 'Loading…'}
        error={Boolean(error)}
        onRetry={onRetry}
        skeleton={<TableSkeleton columns={columns} />}
      />
    );
  }

  // The pager is under the rows: a new page is read from its top
  const turnPage = (offset: number) => {
    onPage(offset);
    if (top.current && top.current.getBoundingClientRect().top < 0) {
      top.current.scrollIntoView({ block: 'start' });
    }
  };

  return (
    <div ref={top} aria-busy={loading} className="scroll-mt-3">
      <Card className="relative">
        {loading && <ProgressBar className="top-0 z-20" />}
        <div className={cn('transition-opacity', loading && 'opacity-60 delay-150')}>
          {/* A page past the end (rows changed meanwhile) still needs the pager to get back */}
          {page.total === 0 ? (
            <EmptyState {...empty} />
          ) : (
            <>
              {children}
              <div className="border-t px-4 py-3">
                <Pager offset={page.offset} limit={page.limit} total={page.total} onChange={turnPage} />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
