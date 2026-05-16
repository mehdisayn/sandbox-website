// The postMessage protocol between the app (host) and the runtime shell.
// Per ARCHITECTURE.md §2.3. The shape is identical to the native app's protocol
// (lib/runtime-shell.ts); only the transport differs (iframe vs WebView).

export type CachedDependency = {
  name: string;   // import specifier, e.g. "chart.js"
  source: string; // UMD/IIFE JS source
};

export type HostMountMessage = {
  type: 'mount';
  source: string;
  kind: 'jsx' | 'html';
  deps?: CachedDependency[];
};

export type ShellStage =
  | 'ready'
  | 'mounted'
  | 'error'
  | 'network-error'
  | 'dep-error';

export type ShellMessage = {
  stage: ShellStage;
  detail?: unknown;
};

export const RUNTIME_ORIGIN: string =
  import.meta.env.VITE_RUNTIME_ORIGIN ?? 'http://localhost:5174';

export const APP_ORIGIN: string =
  import.meta.env.VITE_APP_ORIGIN ?? window.location.origin;
