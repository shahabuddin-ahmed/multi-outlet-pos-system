import { cn } from '@/lib/utils';

export function Brand({ caption, className }: { caption: string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-primary text-[15px] font-bold text-primary-foreground shadow-sm"
      >
        P
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-bold text-foreground">POS</span>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </span>
    </span>
  );
}
