import { ChevronDown } from 'lucide-react';

// The accounts the API's demo data creates. Their password is not in this code: it comes from
// NEXT_PUBLIC_DEMO_PASSWORD, and without it nothing is shown. Never set it on a real installation.
export const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '';

const DEMO_ACCOUNTS = [
  { email: 'hq@demo.test', label: 'HQ admin' },
  { email: 'manager.dhk@demo.test', label: 'Manager · Dhanmondi' },
  { email: 'cashier.dhk@demo.test', label: 'Cashier · Dhanmondi' },
  { email: 'manager.gul@demo.test', label: 'Manager · Gulshan' },
  { email: 'cashier.gul@demo.test', label: 'Cashier · Gulshan' }
];

export function DemoAccounts({ disabled, onPick }: { disabled: boolean; onPick: (email: string) => void }) {
  return (
    <details open className="group">
      {/* The app's own arrow in place of the browser's triangle */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        Demo accounts (one click signs in)
        <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-2 flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(account.email)}
              className="w-full rounded-[10px] border bg-secondary px-3 py-2 text-left text-sm hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <span className="block font-semibold">{account.label}</span>
              <span className="block text-xs text-muted-foreground">{account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
