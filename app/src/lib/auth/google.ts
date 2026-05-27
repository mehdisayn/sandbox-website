// Google Identity Services — token client for Drive sync.
//
// Critical invariants:
//  • The access token lives ONLY in this module's closure. Never written to
//    localStorage, sessionStorage, IndexedDB, or any other browser-readable
//    store. Tab close == soft sign-out for that tab.
//  • Scope is `drive.appdata` only. If the user un-ticks it, we abort.
//  • `withFreshToken` is the only sanctioned way to get a token; it handles
//    silent refresh on 401 / near-expiry transparently.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

// Minimal subset of the GIS surface we actually call. Avoids pulling a 25k
// `@types/google.accounts` dep when we use ~3 symbols.
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: '' | 'consent' | 'none' | 'select_account' }) => void;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type TokenState = {
  token: string;
  expiresAt: number; // ms epoch
  scope: string;
};

let tokenState: TokenState | null = null;
let tokenClient: TokenClient | null = null;
let gisReady: Promise<void> | null = null;

// One-flight gate: GIS's callback is sticky, so we hold the pending Promise
// here and clear it once the callback fires.
let inFlight: { resolve: (s: TokenState) => void; reject: (e: Error) => void } | null = null;

function loadGIS(): Promise<void> {
  if (gisReady) return gisReady;
  gisReady = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return gisReady;
}

function ensureClient(): TokenClient {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services not loaded');
  if (tokenClient) return tokenClient;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (resp) => {
      const pending = inFlight;
      inFlight = null;
      if (!pending) return;
      if (resp.error || !resp.access_token) {
        return pending.reject(new Error(resp.error_description ?? resp.error ?? 'OAuth failed'));
      }
      if (!resp.scope?.includes('drive.appdata')) {
        return pending.reject(new Error('Drive permission was not granted'));
      }
      const expiresIn = resp.expires_in ?? 3600;
      tokenState = {
        token: resp.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
        scope: resp.scope,
      };
      pending.resolve(tokenState);
    },
    error_callback: (err) => {
      const pending = inFlight;
      inFlight = null;
      pending?.reject(new Error(err.message ?? err.type ?? 'OAuth flow was cancelled'));
    },
  });
  return tokenClient;
}

async function requestToken(prompt: '' | 'consent' | 'none' | 'select_account'): Promise<TokenState> {
  await loadGIS();
  const client = ensureClient();
  if (inFlight) throw new Error('Token request already in flight');
  return new Promise<TokenState>((resolve, reject) => {
    inFlight = { resolve, reject };
    try {
      client.requestAccessToken({ prompt });
    } catch (err) {
      inFlight = null;
      reject(err as Error);
    }
  });
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export async function fetchUserInfo(token: string): Promise<GoogleProfile> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`userinfo HTTP ${res.status}`);
  const j = await res.json();
  return { sub: j.sub, email: j.email, name: j.name ?? j.email, picture: j.picture };
}

export function isConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export function hasToken(): boolean {
  return tokenState !== null && tokenState.expiresAt > Date.now();
}

// Interactive sign-in. Shows the consent popup the first time, then the
// account chooser thereafter.
export async function interactiveSignIn(): Promise<TokenState> {
  return requestToken('consent');
}

// Silent re-auth. Will resolve only if the user already granted the scope
// and is still signed in to a Google account in this browser; otherwise
// rejects without showing UI.
export async function silentSignIn(): Promise<TokenState> {
  return requestToken('');
}

// Returns a valid token, refreshing silently if <60s of life remain.
// Wrap every Drive call in this.
export async function withFreshToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  if (!tokenState || tokenState.expiresAt - Date.now() < 60_000) {
    await silentSignIn();
  }
  if (!tokenState) throw new Error('No access token');
  try {
    return await fn(tokenState.token);
  } catch (err) {
    // One-shot retry on 401 — Drive may have invalidated the token early.
    if ((err as Error).message.includes('HTTP 401')) {
      await silentSignIn();
      if (!tokenState) throw err;
      return fn(tokenState.token);
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  const t = tokenState?.token;
  tokenState = null;
  if (!t) return;
  await new Promise<void>((resolve) => {
    if (!window.google?.accounts?.oauth2) return resolve();
    // GIS's revoke is callback-style. We also POST to /revoke as belt-and-braces.
    try { window.google.accounts.oauth2.revoke(t, () => resolve()); }
    catch { resolve(); }
  });
  // Best-effort POST; ignore errors (token may already be revoked).
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(t)}`, { method: 'POST', mode: 'no-cors' });
  } catch { /* ignore */ }
}
