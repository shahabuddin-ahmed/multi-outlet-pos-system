// The login token lives in session storage: it is gone when the tab closes, and it expires on the server anyway.
const KEY = 'pos.token';

// Used when the browser blocks storage: the login then lasts until the page is reloaded
let memory: string | null = null;

export function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function setToken(token: string): void {
  memory = token;
  try {
    window.sessionStorage.setItem(KEY, token);
  } catch {
    // Kept in memory only
  }
}

export function clearToken(): void {
  memory = null;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing was stored
  }
}
