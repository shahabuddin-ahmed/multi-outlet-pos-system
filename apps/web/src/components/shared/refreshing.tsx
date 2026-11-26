import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

// A thin moving line. It appears only when loading takes a moment, so a quick answer does not flash.
export function ProgressBar({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn('progress-bar absolute inset-x-0 h-[3px] overflow-hidden rounded-full', className)}
    >
      <span className="sr-only">Updating…</span>
      <span aria-hidden="true" className="block h-full w-2/5 rounded-full bg-primary" />
    </div>
  );
}

interface RefreshingProps extends PropsWithChildren {
  active: boolean;
  // False keeps the content at full strength, for screens that are used while they reload
  fade?: boolean;
  // Layout of the content
  className?: string;
}

// Keeps the last answer on screen while the next one loads, and shows that it is loading
export function Refreshing({ active, fade = true, className, children }: RefreshingProps) {
  return (
    <div aria-busy={active} className="relative">
      {active && <ProgressBar className="-top-2" />}
      <div className={cn('transition-opacity', active && fade && 'opacity-60 delay-150', className)}>{children}</div>
    </div>
  );
}
