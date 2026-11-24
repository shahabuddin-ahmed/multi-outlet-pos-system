import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { buttonVariants } from '@/components/ui/button';

export default function OverviewPage() {
  return (
    <AppShell>
      <section className="flex max-w-[860px] flex-col gap-3.5">
        <h1 className="text-4xl leading-tight font-bold tracking-tight">Multi-outlet POS</h1>
        <p className="text-[17px] leading-relaxed text-gray-700">
          HQ manages the master menu and assigns it to outlets. Each outlet sells and keeps its own stock. HQ sees
          revenue and top items across all outlets.
        </p>
        <div className="flex flex-wrap gap-3 pt-1.5">
          <Link href="/posts" className={buttonVariants({ variant: 'outline' })}>
            Open the sample page
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
