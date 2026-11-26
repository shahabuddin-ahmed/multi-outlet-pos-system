import { Card } from '@/components/ui/card';

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-[26px] leading-tight font-semibold tracking-tight break-words">{value}</p>
    </Card>
  );
}
