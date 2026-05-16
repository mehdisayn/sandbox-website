import { Link } from 'react-router-dom';

export function Welcome() {
  return (
    <main className="min-h-screen flex flex-col bg-paper text-ink">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <img
          src="/icon.png"
          alt="SANDBOX"
          className="h-24 w-24 rounded-[22px] border-[1.5px] border-ink shadow-sm"
        />
        <h1 className="mt-6 text-[44px] md:text-[56px] font-bold tracking-[-0.02em] leading-none">
          SANDBOX <span className="text-ink-soft font-normal">/ Web</span>
        </h1>
        <p className="mt-3 max-w-md text-[15px] md:text-base text-ink-soft">
          Run AI-generated JSX and HTML artifacts in your browser as a personal library of mini-apps.
        </p>

        <Link
          to="/library"
          className="mt-9 inline-flex items-center gap-2 rounded-xl border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_0_rgb(var(--ink))] hover:translate-y-[1px] hover:shadow-none transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
        >
          Get started
          <span aria-hidden="true">→</span>
        </Link>

        <Link
          to="/settings/about"
          className="mt-3 font-mono text-[10.5px] uppercase tracking-widest text-ink-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded"
        >
          About SANDBOX
        </Link>
      </div>

      <footer className="px-6 py-5 text-center font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        Built by Syed Mehedi Hussain
      </footer>
    </main>
  );
}
