import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAP, pageNumbers } from '@/lib/page-numbers';

interface PagerProps {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}

export function Pager({ offset, limit, total, onChange }: PagerProps) {
  const first = Math.min(offset + 1, total);
  const last = Math.min(offset + limit, total);
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(pages, Math.floor(offset / limit) + 1);

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {first}–{last} of {total.toLocaleString('en-US')}
      </span>
      {(pages > 1 || offset > 0) && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={offset === 0}
            onClick={() => onChange(Math.max(0, offset - limit))}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <ul className="hidden items-center gap-1 sm:flex">
            {pageNumbers(current, pages).map((page, index) =>
              page === GAP ? (
                <li key={`gap-${index}`} aria-hidden="true" className="w-9 text-center">
                  …
                </li>
              ) : (
                <li key={page}>
                  <Button
                    variant={page === current ? 'default' : 'ghost'}
                    size="sm"
                    className="min-w-9 px-2 tabular-nums"
                    aria-label={`Page ${page}`}
                    aria-current={page === current ? 'page' : undefined}
                    onClick={() => onChange((page - 1) * limit)}
                  >
                    {page}
                  </Button>
                </li>
              )
            )}
          </ul>
          <span className="px-1 tabular-nums sm:hidden">
            Page {current} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={offset + limit >= total}
            onClick={() => onChange(offset + limit)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      )}
    </nav>
  );
}
