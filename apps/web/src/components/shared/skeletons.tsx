import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Placeholders in the shape of what is loading, so the screen does not jump when it arrives.
// Show them through PageState, which tells screen readers.

// Lines of different lengths look like text; the same ones every time
const WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6'];
const widthOf = (index: number) => WIDTHS[index % WIDTHS.length];

const rangeOf = (length: number) => Array.from({ length }, (_, index) => index);

export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <Card>
      <div className="flex gap-4 border-b px-4 py-4">
        {rangeOf(columns).map((column) => (
          <div key={column} className="flex-1">
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      {rangeOf(rows).map((row) => (
        <div key={row} className="flex gap-4 border-b px-4 py-5 last:border-b-0">
          {rangeOf(columns).map((column) => (
            <div key={column} className="flex-1">
              <Skeleton className={cn('h-4', widthOf(row + column))} />
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}

// A short list inside a card, for example the best sellers
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {rangeOf(rows).map((row) => (
        <div key={row} className="border-b py-3.5 last:border-b-0">
          <Skeleton className={cn('h-4', widthOf(row))} />
        </div>
      ))}
    </div>
  );
}

interface CardGridSkeletonProps {
  count: number;
  // The grid of the screen it stands in for, and the height of one card
  className: string;
  cardClassName: string;
}

export function CardGridSkeleton({ count, className, cardClassName }: CardGridSkeletonProps) {
  return (
    <div className={className}>
      {rangeOf(count).map((index) => (
        <Card key={index} className={cn('flex flex-col gap-3 p-4', cardClassName)}>
          <Skeleton className={cn('h-4', widthOf(index))} />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}
