import { AppShell } from '@/components/layout/app-shell';

export default function OverviewPage() {
  return (
    <AppShell>
      <section className="flex max-w-[860px] flex-col gap-3.5">
        <h1 className="text-4xl leading-tight font-bold tracking-tight">Multi-outlet POS</h1>
        <p className="text-[17px] leading-relaxed text-gray-700">
          HQ manages the master menu and assigns it to outlets. Each outlet sells and keeps its own stock. HQ sees
          revenue and top items across all outlets.
        </p>
      </section>
    </AppShell>
  );
}
