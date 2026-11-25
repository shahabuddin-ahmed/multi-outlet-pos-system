'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/layout/brand';
import { FullPage } from '@/components/layout/full-page';
import { PageState } from '@/components/shared/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DEMO_PASSWORD, DemoAccounts } from '@/features/login/demo-accounts';
import { useAppDispatch, useAppSelector } from '@/hooks/use-app-redux';
import { homeOf } from '@/lib/access';
import { errorMessage } from '@/lib/api';
import { restoreSession, signIn } from '@/stores/slices/session-slice';

export function LoginView() {
  const session = useAppSelector((state) => state.session);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session.status === 'signedIn') {
      router.replace(homeOf(session.user.role));
    }
  }, [session, router]);

  const enter = async (asEmail: string, withPassword: string) => {
    setBusy(true);
    setError('');
    try {
      await dispatch(signIn(asEmail, withPassword));
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void enter(email, password);
  };

  if (session.status !== 'signedOut') {
    const unreachable = session.status === 'unreachable';
    return (
      <FullPage>
        <PageState
          message={unreachable ? session.message : 'Signing in…'}
          error={unreachable}
          onRetry={() => void dispatch(restoreSession())}
        />
      </FullPage>
    );
  }

  // Why the person is here (signed out by the server), until they try again
  const message = error || (busy ? '' : session.notice);

  return (
    <FullPage>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Brand caption="Sign in to continue" />
          <h1 className="sr-only">Sign in</h1>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={120}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                maxLength={128}
                required
              />
            </label>
            {/* Always present, so a screen reader announces the message when it appears */}
            <p role="alert" className="text-sm text-red-700 empty:hidden">
              {message}
            </p>
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          {DEMO_PASSWORD && <DemoAccounts disabled={busy} onPick={(demo) => void enter(demo, DEMO_PASSWORD)} />}
        </CardContent>
      </Card>
    </FullPage>
  );
}
