import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  text?: string;
  // Buttons or filters on the right
  children?: ReactNode;
}

export function PageHeader({ title, text, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
