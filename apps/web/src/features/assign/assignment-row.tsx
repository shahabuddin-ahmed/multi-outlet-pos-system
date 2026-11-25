'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Row, Td } from '@/components/ui/table';
import { PriceInput } from '@/features/assign/price-input';
import { useSettings } from '@/features/settings/settings-provider';
import { api, errorMessage } from '@/lib/api';
import { priceText } from '@/lib/price-input';
import type { Assignment, AssignmentInput, MenuItem } from '@/types';

interface AssignmentRowProps {
  outletId: string;
  item: MenuItem;
  // Left out when the outlet does not have the item
  assignment?: Assignment;
  onSaved: (assignment: Assignment) => void;
}

// The changes of one row are sent one after the other. Each carries the whole assignment, so a switch
// clicked while a price is still saving must start from that price, not from the one before it.
function useSaveInTurn({ outletId, item, assignment, onSaved }: AssignmentRowProps) {
  const latest = useRef(assignment);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    latest.current = assignment;
  }, [assignment]);

  const save = (change: Partial<AssignmentInput>, done: string): Promise<boolean> => {
    setWaiting((count) => count + 1);
    const result = queue.current.then(async () => {
      const current = latest.current;
      try {
        const saved = await api.saveAssignment(outletId, item.id, {
          priceOverrideCents: current?.priceOverrideCents ?? null,
          isAvailable: current?.isAvailable ?? true,
          ...change
        });
        latest.current = saved;
        onSaved(saved);
        toast.success(done);
        return true;
      } catch (error) {
        toast.error(`${item.name}: ${errorMessage(error)}`);
        return false;
      } finally {
        setWaiting((count) => count - 1);
      }
    });
    queue.current = result;
    return result;
  };

  return { save, saving: waiting > 0 };
}

export function AssignmentRow(props: AssignmentRowProps) {
  const { item, assignment } = props;
  const { money } = useSettings();
  const { save, saving } = useSaveInTurn(props);

  const name = (
    <Td>
      <span className="font-semibold">{item.name}</span>{' '}
      {!item.isActive && <Badge variant="error">Off at head office</Badge>}
      <span className="block text-xs text-muted-foreground">{item.sku}</span>
    </Td>
  );
  const masterPrice = <Td className="text-right whitespace-nowrap tabular-nums">{money(item.basePriceCents)}</Td>;

  if (!assignment) {
    return (
      <Row>
        {name}
        {masterPrice}
        <Td colSpan={4} className="text-muted-foreground">
          Not assigned
        </Td>
        <Td className="text-right">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            aria-label={`Assign ${item.name}`}
            onClick={() => void save({}, `${item.name} assigned. Its stock starts at 0.`)}
          >
            Assign
          </Button>
        </Td>
      </Row>
    );
  }

  return (
    <Row aria-busy={saving}>
      {name}
      {masterPrice}
      <Td>
        <PriceInput
          key={String(assignment.priceOverrideCents)}
          label={`Outlet price for ${item.name}`}
          saved={assignment.priceOverrideCents}
          placeholder={priceText(item.basePriceCents)}
          onSave={(priceOverrideCents) => save({ priceOverrideCents }, `${item.name}: price saved`)}
        />
      </Td>
      <Td>
        {assignment.priceSource === 'OUTLET' ? (
          <Badge variant="primary">Outlet price</Badge>
        ) : (
          <Badge>Inherited from master</Badge>
        )}
      </Td>
      <Td>
        <Switch
          aria-label={`On at this outlet: ${item.name}`}
          checked={assignment.isAvailable}
          onChange={(event) =>
            void save(
              { isAvailable: event.target.checked },
              `${item.name} is ${event.target.checked ? 'on' : 'off'} at this outlet`
            )
          }
        />
      </Td>
      <Td className="text-right font-semibold whitespace-nowrap tabular-nums">
        {money(assignment.effectivePriceCents)}
      </Td>
      <Td className="text-right whitespace-nowrap tabular-nums">{assignment.stock}</Td>
    </Row>
  );
}
