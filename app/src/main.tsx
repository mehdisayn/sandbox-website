import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { installLogCapture } from './lib/logs';
import { attemptSilentSignIn } from './lib/sync/coordinator';
import './index.css';

installLogCapture();

// Fire and forget — if cloud_enabled was true on a prior session, this kicks
// the silent re-auth path. Failure is non-fatal; the app falls back to local
// mode and the user can click sign-in.
void attemptSilentSignIn();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
