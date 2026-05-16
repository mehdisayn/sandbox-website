import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { BottomNav } from '../../components/BottomNav';
import type { ReactNode } from 'react';

export function SettingsLayout({
  title, back = '/settings', right, children,
}: {
  title: string;
  back?: string | null;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-paper text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-divider px-4 py-3 md:px-6">
          {back && (
            <Link to={back} className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">← Back</Link>
          )}
          <div className="flex-1 text-sm font-medium">{title}</div>
          {right}
        </div>
        <div className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-2xl">{children}</div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
