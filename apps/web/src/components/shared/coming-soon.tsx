import { Hammer } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';

// Stands in for a screen until its feature is built. Remove it with the last such page.
export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <>
      <PageHeader title={title} text={text} />
      <Card>
        <EmptyState icon={Hammer} title="Not built yet" text="This screen comes in a later step." />
      </Card>
    </>
  );
}
