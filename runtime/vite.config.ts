import { defineConfig } from 'vite';

const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:5173';

// CSP per ARCHITECTURE.md §3. Babel requires unsafe-inline + unsafe-eval to
// transpile and execute JSX at runtime. frame-ancestors restricts who can frame
// us. connect-src is the CDN allowlist plus self for the local lib bundles.
const CSP = [
  `default-src 'none'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com`,
  `frame-ancestors ${APP_ORIGIN}`,
  `base-uri 'none'`,
  `form-action 'none'`,
].join('; ');

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174,
    strictPort: true,
    headers: {
      'Content-Security-Policy': CSP,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
    headers: {
      'Content-Security-Policy': CSP,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { shell: 'public/shell.html' },
    },
  },
});
