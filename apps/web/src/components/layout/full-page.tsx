import type { PropsWithChildren } from 'react';

// For what is shown without the app around it: loading, errors, sign in
export function FullPage({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <div className="flex w-full max-w-[420px] flex-col gap-4">{children}</div>
    </main>
  );
}
