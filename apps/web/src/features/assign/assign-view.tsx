'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { OutletAssignments } from '@/features/assign/outlet-assignments';
import { OneOutlet } from '@/features/outlets/one-outlet';

const TITLE = 'Assign menu';
const TEXT = 'Pick what each outlet sells, and at which price';

export function AssignView() {
  return (
    <OneOutlet title={TITLE} text={TEXT}>
      {(outlet, picker) => (
        <>
          <PageHeader title={TITLE} text={TEXT}>
            {!outlet.isActive && <Badge variant="warn">This outlet is off</Badge>}
            {picker}
          </PageHeader>
          {/* A new key per outlet: search, page and unsaved input start fresh */}
          <OutletAssignments key={outlet.id} outlet={outlet} />
        </>
      )}
    </OneOutlet>
  );
}
