import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface ConfirmSwitchOffProps {
  name: string;
  // What stops working
  effect: string;
  busy: boolean;
  onKeep: () => void;
  onSwitchOff: () => void;
}

// Switching off affects sales, so it asks first. Switching on does not.
export function ConfirmSwitchOff({ name, effect, busy, onKeep, onSwitchOff }: ConfirmSwitchOffProps) {
  return (
    <Dialog title={`Switch off ${name}?`} onClose={onKeep}>
      <p className="text-sm text-muted-foreground">{effect}</p>
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onKeep}>
          Keep on
        </Button>
        <Button variant="destructive" disabled={busy} onClick={onSwitchOff}>
          Switch off
        </Button>
      </div>
    </Dialog>
  );
}
