import type { PropsWithChildren } from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageState } from '@/components/shared/page-state';
import { Pager } from '@/components/shared/pager';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Paged } from '@/types';

export function SearchInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="search"
      aria-label={label}
      placeholder="Search…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={100}
      className="w-56"
    />
  );
}

interface ListCardProps<T> extends PropsWithChildren {
  page: Paged<T> | null;
  error: string;
  onRetry: () => void;
  onPage: (offset: number) => void;
  // Shown instead of the table when there is no row
  empty: { title: string; text?: string };
}

// One paged list: loading, error, empty and the rows with their pager
export function ListCard<T>({ page, error, onRetry, onPage, empty, children }: ListCardProps<T>) {
  if (error || !page) {
    return <PageState message={error || 'Loading…'} error={Boolean(error)} onRetry={onRetry} />;
  }

  // A page past the end (rows changed meanwhile) still needs the pager to get back
  if (page.total === 0) {
    return (
      <Card>
        <EmptyState icon={Search} title={empty.title} text={empty.text} />
      </Card>
    );
  }

  return (
    <Card>
      {children}
      <div className="border-t px-4 py-3">
        <Pager offset={page.offset} limit={page.limit} total={page.total} onChange={onPage} />
      </div>
    </Card>
  );
}
