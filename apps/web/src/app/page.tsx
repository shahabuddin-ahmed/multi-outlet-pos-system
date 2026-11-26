import { RedirectHome } from '@/features/session/redirect-home';
import { RequireSession } from '@/features/session/require-session';

// "/" has no page of its own: each role starts somewhere else
export default function RootPage() {
  return (
    <RequireSession>
      <RedirectHome />
    </RequireSession>
  );
}
