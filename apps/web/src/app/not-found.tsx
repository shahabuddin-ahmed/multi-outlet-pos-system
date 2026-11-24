import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <AppShell>
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page does not exist. Check the address, or start from the overview.
        </p>
        <Link href="/" className={buttonVariants()}>
          Go to the overview
        </Link>
      </Card>
    </AppShell>
  );
}
