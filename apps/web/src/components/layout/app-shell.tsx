import type { PropsWithChildren } from 'react';
import { ConnectionBanner, ConnectionProvider } from '@/components/layout/connection';
import { Footer } from '@/components/layout/footer';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <ConnectionProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-col lg:pl-60">
          <TopBar />
          <ConnectionBanner />
          <main className="flex flex-1 flex-col gap-6 px-4 pt-7 pb-12 lg:px-9">{children}</main>
          <Footer />
        </div>
      </div>
    </ConnectionProvider>
  );
}
