'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren
} from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

export type ConnectionState = 'checking' | 'online' | 'offline' | 'unreachable';

const CHECK_EVERY_MS = 30_000;
// Looked at more often while something is wrong, so the warning goes soon after the cause
const RETRY_EVERY_MS = 5_000;
// A server that says "too many requests" is there
const TOO_MANY_REQUESTS = 429;
const TOAST_ID = 'connection';

export const CONNECTION_PROBLEMS: Partial<Record<ConnectionState, string>> = {
  offline: 'No internet connection. Nothing can be saved until it is back.',
  unreachable: 'The server is not answering. Trying again every few seconds.'
};

interface Connection {
  state: ConnectionState;
  checkNow: () => void;
}

const ConnectionContext = createContext<Connection | null>(null);

function subscribeToNetwork(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

const answers = (): Promise<boolean> =>
  api.health().then(
    () => true,
    (error: unknown) => error instanceof ApiError && error.status === TOO_MANY_REQUESTS
  );

// Watches the connection for as long as the app is open: the device's network and the server's health
export function ConnectionProvider({ children }: PropsWithChildren) {
  const deviceOnline = useSyncExternalStore(
    subscribeToNetwork,
    () => navigator.onLine,
    () => true
  );
  const [server, setServer] = useState<'checking' | 'up' | 'down'>('checking');
  // Raised to check at once
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!deviceOnline) {
      return;
    }
    let stopped = false;
    let timer: number | undefined;
    const check = async () => {
      const up = await answers();
      if (!stopped) {
        setServer(up ? 'up' : 'down');
        timer = window.setTimeout(check, up ? CHECK_EVERY_MS : RETRY_EVERY_MS);
      }
    };
    void check();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [deviceOnline, attempt]);

  useEffect(() => {
    // What was known before the network dropped says nothing about now
    const forget = () => setServer('checking');
    // A tab that comes back to the front has had its timers slowed down
    const recheck = () => document.visibilityState === 'visible' && setAttempt((count) => count + 1);
    window.addEventListener('offline', forget);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('offline', forget);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  let state: ConnectionState = 'offline';
  if (deviceOnline) {
    state = server === 'checking' ? 'checking' : server === 'up' ? 'online' : 'unreachable';
  }

  // Said once when it changes, for whoever has scrolled past the banner
  const warned = useRef(false);
  useEffect(() => {
    const problem = CONNECTION_PROBLEMS[state];
    if (problem) {
      warned.current = true;
      toast.warning(problem, { id: TOAST_ID });
    } else if (state === 'online' && warned.current) {
      warned.current = false;
      toast.success('Connected again', { id: TOAST_ID });
    }
  }, [state]);

  const value = useMemo(() => ({ state, checkNow: () => setAttempt((count) => count + 1) }), [state]);

  return <ConnectionContext value={value}>{children}</ConnectionContext>;
}

export function useConnection(): Connection {
  const connection = useContext(ConnectionContext);
  if (!connection) {
    throw new Error('useConnection needs a ConnectionProvider above it');
  }
  return connection;
}

// Stays above the page while the cause is there
export function ConnectionBanner() {
  const { state, checkNow } = useConnection();
  const problem = CONNECTION_PROBLEMS[state];

  return (
    <div role="status">
      {problem && (
        <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-900 lg:mx-9">
          <span className="flex items-center gap-2.5">
            <WifiOff aria-hidden="true" className="size-4 shrink-0" />
            {problem}
          </span>
          {state === 'unreachable' && (
            <Button variant="outline" size="sm" onClick={checkNow}>
              Try now
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
