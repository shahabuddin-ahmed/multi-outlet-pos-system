import type { PropsWithChildren } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RequirePageAccess } from '@/features/session/require-page-access';
import { RequireSession } from '@/features/session/require-session';
import { SettingsProvider } from '@/features/settings/settings-provider';

// Every page in this folder needs a signed-in person whose role may open it
export default function SignedInLayout({ children }: PropsWithChildren) {
  return (
    <RequireSession>
      <SettingsProvider>
        <AppShell>
          <RequirePageAccess>{children}</RequirePageAccess>
        </AppShell>
      </SettingsProvider>
    </RequireSession>
  );
}
