import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { Caption } from '../../components/ui/Caption';
import { Pill } from '../../components/ui/Pill';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function Sync() {
  const configured = CLIENT_ID.length > 0;

  return (
    <SettingsLayout title="Sync">
      <Group label="Cloud sync">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Google Drive</span>
            <Pill tone={configured ? 'neutral' : 'danger'}>
              {configured ? 'coming soon' : 'not configured'}
            </Pill>
          </div>
          <p className="text-[12px] text-ink-soft">
            Sign in with Google and your library syncs to a hidden folder in your
            own Drive. Nothing leaves your account; SANDBOX has no server.
          </p>
          <p className="text-[12px] text-ink-soft">
            The sign-in flow is being wired up — this screen is the placeholder
            until it lands. Local-only mode keeps working unchanged in the meantime.
          </p>
        </div>
      </Group>

      <Group label="Status">
        <div className="flex flex-col gap-1 p-4 font-mono text-[11px] text-ink-soft">
          <div className="flex justify-between"><span>Client ID</span><Caption>{configured ? 'set' : 'missing'}</Caption></div>
          <div className="flex justify-between"><span>Sign-in flow</span><Caption>phase B</Caption></div>
          <div className="flex justify-between"><span>Drive client</span><Caption>phase B</Caption></div>
          <div className="flex justify-between"><span>Sync engine</span><Caption>phase B</Caption></div>
        </div>
      </Group>
    </SettingsLayout>
  );
}
