import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Scrolls sideways on a narrow screen instead of squeezing the columns
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    // relative: hidden screen reader text in the cells must scroll with the table, not widen the page.
    // From 1280px the tables fit, so this stops being a scroll box and the header can stick to the screen.
    <div className="relative overflow-x-auto xl:overflow-x-visible">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  );
}

export function TableHead({ children }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="text-xs text-muted-foreground uppercase">
      {/* The line under the header is a shadow: a border does not travel with a sticky cell */}
      <tr className="table-head [&>th]:shadow-[inset_0_-1px_0_hsl(var(--border))] xl:[&>th]:sticky xl:[&>th]:top-0 xl:[&>th]:z-10 xl:[&>th]:bg-card xl:[&>th:first-child]:rounded-tl-xl xl:[&>th:last-child]:rounded-tr-xl">
        {children}
      </tr>
    </thead>
  );
}

export function Row({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b transition-colors last:border-b-0 hover:bg-muted/50', className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn('px-4 py-3 font-semibold', className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />;
}
