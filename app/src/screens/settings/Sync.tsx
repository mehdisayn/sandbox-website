import { useEffect, useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { Caption } from '../../components/ui/Caption';
import { Btn } from '../../components/ui/Btn';
import { Pill } from '../../components/ui/Pill';
import { Modal } from '../../components/Modal';
import {
  forceResync,
  getStatus,
  onStatusChange,
  resolveAccountSwitch,
  resolveMigrationPrompt,
  signOut,
  startInteractiveSignIn,
  type SignOutChoice,
  type SyncStatus,
} from '../../lib/sync/coordinator';
import { onStateChange, type EngineState } from '../../lib/sync/engine';
import { isConfigured } from '../../lib/auth/google';
import type { PromptDecision } from '../../lib/migration/first-signin';

export function Sync() {
  const [status, setStatus] = useState<SyncStatus>(getStatus());
  const [engine, setEngine] = useState<EngineState>({ kind: 'idle', queueDepth: 0 });
  const [showSignOut, setShowSignOut] = useState(false);
  const [signOutChoice, setSignOutChoice] = useState<SignOutChoice>('keep-local');
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => onStatusChange(setStatus), []);
  useEffect(() => onStateChange(setEngine), []);

  const configured = isConfigured();

  return (
    <SettingsLayout title="Sync">
      <Group label="Cloud sync">
        <div className="flex flex-col gap-3 p-4">
          {!configured && (
            <NotConfiguredCard />
          )}

          {configured && status.kind === 'signed-out' && (
            <SignedOutCard onSignIn={startInteractiveSignIn} />
          )}

          {configured && status.kind === 'signing-in' && (
            <div className="text-sm text-ink-soft">Signing in… (a Google popup should appear)</div>
          )}

          {status.kind === 'error' && (
            <div className="whitespace-pre-wrap rounded-lg border border-destructive bg-paper-alt px-3 py-2 font-mono text-xs text-destructive">
              {status.message}
              <div className="mt-2"><Btn onClick={startInteractiveSignIn}>Try again</Btn></div>
            </div>
          )}

          {status.kind === 'signed-in' && (
            <SignedInCard
              profile={status.profile}
              engine={engine}
              resyncing={resyncing}
              onResync={async () => { setResyncing(true); try { await forceResync(); } finally { setResyncing(false); } }}
              onSignOutClick={() => setShowSignOut(true)}
            />
          )}
        </div>
      </Group>

      <Group label="How it works">
        <div className="flex flex-col gap-2 p-4 text-[12px] text-ink-soft">
          <p>
            Sign in once. SANDBOX puts a hidden folder in your Google Drive
            (`appDataFolder` — not visible in drive.google.com) and syncs your
            library there. There is no SANDBOX server in the middle.
          </p>
          <p>
            Sign out anywhere any time — you can keep the local copy or wipe it.
            Revoke access from <a className="underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>.
          </p>
        </div>
      </Group>

      {/* Modals */}
      {status.kind === 'awaiting-account-switch' && (
        <AccountSwitchModal
          previousEmail={status.check.previous.email}
          nextEmail={status.profile.email}
          onCancel={() => resolveAccountSwitch('cancel')}
          onWipe={() => resolveAccountSwitch('wipe-and-continue')}
        />
      )}

      {status.kind === 'awaiting-migration-prompt' && (
        <MigrationPromptModal
          localCount={status.outcome.localExtras.length}
          remoteCount={status.outcome.remoteCount}
          onDecide={(d) => resolveMigrationPrompt(d)}
        />
      )}

      {showSignOut && (
        <SignOutModal
          choice={signOutChoice}
          onChoiceChange={setSignOutChoice}
          onConfirm={async () => { setShowSignOut(false); await signOut(signOutChoice); }}
          onCancel={() => setShowSignOut(false)}
        />
      )}
    </SettingsLayout>
  );
}

function NotConfiguredCard() {
  return (
    <div className="rounded-lg border border-destructive bg-paper-alt px-3 py-3 font-mono text-xs text-destructive">
      <div className="font-semibold not-italic">Not configured</div>
      <div className="mt-1 text-[11px]">Set VITE_GOOGLE_CLIENT_ID in app/.env.development. See <span className="not-italic">walkthrough.md</span>.</div>
    </div>
  );
}

function SignedOutCard({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm">Your library is currently <span className="font-mono">local-only</span>. Sign in with Google to sync across devices.</div>
      <div className="flex">
        <Btn variant="primary" onClick={onSignIn}>Sign in with Google</Btn>
      </div>
    </div>
  );
}

function SignedInCard({
  profile, engine, resyncing, onResync, onSignOutClick,
}: {
  profile: { email: string; name: string; picture?: string };
  engine: EngineState;
  resyncing: boolean;
  onResync: () => void;
  onSignOutClick: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        {profile.picture && (
          <img src={profile.picture} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full border border-border" />
        )}
        <div className="flex flex-col">
          <div className="text-sm font-medium">{profile.name}</div>
          <div className="font-mono text-[11px] text-ink-soft">{profile.email}</div>
        </div>
        <div className="flex-1" />
        <Pill tone="accent">connected</Pill>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-[11px] text-ink-soft">
        <div className="flex justify-between"><span>State</span><Caption>{engine.kind}</Caption></div>
        <div className="flex justify-between"><span>Queue</span><Caption>{engine.queueDepth}</Caption></div>
      </div>

      <div className="flex gap-2 pt-2">
        <Btn onClick={onResync} disabled={resyncing}>{resyncing ? 'Resyncing…' : 'Force resync'}</Btn>
        <Btn variant="danger" onClick={onSignOutClick}>Sign out…</Btn>
      </div>
    </>
  );
}

function AccountSwitchModal({
  previousEmail, nextEmail, onCancel, onWipe,
}: { previousEmail: string; nextEmail: string; onCancel: () => void; onWipe: () => void }) {
  return (
    <Modal
      open
      onClose={onCancel}
      title="Different Google account"
      footer={
        <>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" onClick={onWipe}>Wipe local data and continue</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-2 text-[13px] text-ink">
        <p>You're signing in as <span className="font-mono">{nextEmail}</span>, but the previous Google account on this device was <span className="font-mono">{previousEmail}</span>.</p>
        <p>For safety, the local library will be wiped before syncing the new account's data — otherwise the previous user's artifacts would silently merge into this account's Drive.</p>
        <p className="text-ink-soft">Cancel if this was a mistake.</p>
      </div>
    </Modal>
  );
}

function MigrationPromptModal({
  localCount, remoteCount, onDecide,
}: { localCount: number; remoteCount: number; onDecide: (d: PromptDecision) => void }) {
  return (
    <Modal
      open
      onClose={() => onDecide('keep-local-only')}
      title="Local artifacts not in your Drive"
      footer={
        <>
          <Btn variant="ghost" onClick={() => onDecide('discard')}>Discard</Btn>
          <Btn onClick={() => onDecide('keep-local-only')}>Keep local-only</Btn>
          <Btn variant="primary" onClick={() => onDecide('add')}>Add to Drive</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-2 text-[13px] text-ink">
        <p>Found <span className="font-mono">{localCount}</span> artifact{localCount === 1 ? '' : 's'} on this device that aren't in your synced library (<span className="font-mono">{remoteCount}</span> remote).</p>
        <ul className="ml-4 list-disc text-ink-soft">
          <li><b>Add</b> — upload them so other devices get them too.</li>
          <li><b>Keep local-only</b> — they stay on this device but don't sync.</li>
          <li><b>Discard</b> — delete them from this device.</li>
        </ul>
      </div>
    </Modal>
  );
}

function SignOutModal({
  choice, onChoiceChange, onConfirm, onCancel,
}: { choice: SignOutChoice; onChoiceChange: (c: SignOutChoice) => void; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal
      open
      onClose={onCancel}
      title="Sign out?"
      footer={
        <>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={choice === 'wipe-local' ? 'danger' : 'primary'} onClick={onConfirm}>Sign out</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-[13px] text-ink">
        <p>Your synced artifacts will stay in your Google Drive. Choose what stays on this device:</p>
        <label className="flex items-start gap-3 rounded-xl border-[1.5px] border-border bg-card p-3 cursor-pointer hover:border-ink-soft">
          <input type="radio" name="keep" checked={choice === 'keep-local'} onChange={() => onChoiceChange('keep-local')} className="mt-0.5" />
          <span>
            <span className="block font-medium">Keep local copy</span>
            <span className="block text-ink-soft text-[12px]">Re-sign-in reconciles without re-downloading everything.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border-[1.5px] border-border bg-card p-3 cursor-pointer hover:border-destructive">
          <input type="radio" name="keep" checked={choice === 'wipe-local'} onChange={() => onChoiceChange('wipe-local')} className="mt-0.5" />
          <span>
            <span className="block font-medium text-destructive">Wipe local copy</span>
            <span className="block text-ink-soft text-[12px]">Returns this device to a fresh-install state.</span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
