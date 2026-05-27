import { createBrowserRouter, Outlet } from 'react-router-dom';
import { IngestionProvider } from './components/IngestionProvider';
import { SettingsProvider } from './lib/settings-context';
import { Agent } from './screens/Agent';
import { Compose } from './screens/Compose';
import { Details } from './screens/Details';
import { Library } from './screens/Library';
import { Run } from './screens/Run';
import { Welcome } from './screens/Welcome';
import { About } from './screens/settings/About';
import { AgentSettings } from './screens/settings/Agent';
import { Appearance } from './screens/settings/Appearance';
import { Credits } from './screens/settings/Credits';
import { Dependencies } from './screens/settings/Dependencies';
import { Featured } from './screens/settings/Featured';
import { Logs } from './screens/settings/Logs';
import { SettingsHub } from './screens/settings/SettingsHub';
import { Storage } from './screens/settings/Storage';
import { Sync } from './screens/settings/Sync';

function RootLayout() {
  return (
    <SettingsProvider>
      <IngestionProvider>
        <Outlet />
      </IngestionProvider>
    </SettingsProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Welcome /> },
      { path: '/library', element: <Library /> },
      { path: '/run/:id', element: <Run /> },
      { path: '/details/:id', element: <Details /> },
      { path: '/compose', element: <Compose /> },
      { path: '/agent', element: <Agent /> },
      { path: '/settings', element: <SettingsHub /> },
      { path: '/settings/agent', element: <AgentSettings /> },
      { path: '/settings/appearance', element: <Appearance /> },
      { path: '/settings/dependencies', element: <Dependencies /> },
      { path: '/settings/storage', element: <Storage /> },
      { path: '/settings/sync', element: <Sync /> },
      { path: '/settings/logs', element: <Logs /> },
      { path: '/settings/featured', element: <Featured /> },
      { path: '/settings/about', element: <About /> },
      { path: '/settings/credits', element: <Credits /> },
    ],
  },
]);
