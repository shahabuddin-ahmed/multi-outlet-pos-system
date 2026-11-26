import { CardGridSkeleton } from '@/components/shared/skeletons';

// The tiles and the two cards under them, in the places they will take
export function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <CardGridSkeleton count={3} className="grid gap-4 sm:grid-cols-3" cardClassName="h-24" />
      <CardGridSkeleton count={2} className="grid gap-4 lg:grid-cols-2" cardClassName="h-64" />
    </div>
  );
}
