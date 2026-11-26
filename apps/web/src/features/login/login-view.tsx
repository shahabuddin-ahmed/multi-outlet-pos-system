'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { FullPage } from '@/components/layout/full-page';
import { Field } from '@/components/shared/field';
import { PageState } from '@/components/shared/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DEMO_PASSWORD, DemoAccounts } from '@/features/login/demo-accounts';
import { useAppDispatch, useAppSelector } from '@/hooks/use-app-redux';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { homeOf } from '@/lib/access';
import { errorMessage } from '@/lib/api';
import { restoreSession, signIn } from '@/stores/slices/session-slice';

// Only catches typing slips; the API checks the address properly
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export function LoginView() {
  const session = useAppSelector((state) => state.session);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, check, clear } = useFieldErrors<'email' | 'password'>();

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
    const valid = check({
      email: EMAIL_PATTERN.test(email.trim()) ? '' : 'Enter your email address',
      password: password ? '' : 'Enter your password'
    });
    if (valid) {
      void enter(email, password);
    }
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
          <form onSubmit={submit} noValidate className="flex flex-col gap-3">
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clear('email');
                }}
                maxLength={120}
                required
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clear('password');
                  }}
                  maxLength={128}
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  aria-label="Show password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
            </Field>
            {/* Always present, so a screen reader announces the message when it appears */}
            <p role="alert" className="text-sm text-red-700 empty:hidden">
              {message}
            </p>
            <Button type="submit" loading={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          {DEMO_PASSWORD && <DemoAccounts disabled={busy} onPick={(demo) => void enter(demo, DEMO_PASSWORD)} />}
        </CardContent>
      </Card>
    </FullPage>
  );
}
