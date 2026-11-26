import type { ReactNode } from 'react';
import { SearchX, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  // What to do about it: a button or a link
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, text, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon aria-hidden="true" className="size-5 text-gray-500" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {text && <p className="max-w-md text-sm text-muted-foreground">{text}</p>}
      {children && <div className="flex flex-wrap justify-center gap-2.5 pt-2">{children}</div>}
    </div>
  );
}

// For a search or filter that finds nothing, with the way back
export function noMatch(text: string, onClear: () => void, label = 'Clear search'): EmptyStateProps {
  return {
    icon: SearchX,
    title: 'Nothing matches',
    text,
    children: (
      <Button variant="outline" size="sm" onClick={onClear}>
        {label}
      </Button>
    )
  };
}
