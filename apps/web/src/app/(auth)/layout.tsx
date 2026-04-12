import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-900 text-ink-primary flex flex-col">
      {/* Subtle hero gradient — same as landing */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(0,82,255,0.16) 0%, transparent 60%), ' +
            'radial-gradient(ellipse 40% 30% at 90% 90%, rgba(34,211,238,0.07) 0%, transparent 50%), ' +
            '#06060F',
        }}
      />
      {/* Dot grid */}
      <div className="dot-grid pointer-events-none fixed inset-0 -z-10 opacity-80" />

      {/* Header */}
      <header className="nav-blur border-b border-dim px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 shadow-[0_0_12px_rgba(0,82,255,0.6)]">
            <span className="font-mono text-[11px] font-black text-white leading-none">402</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            MPP<span className="text-brand-400">Studio</span>
          </span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-5 py-4 text-center text-xs text-ink-muted sm:px-8">
        The payment layer for AI services ·{' '}
        <a href="https://www.x402.org" target="_blank" rel="noopener noreferrer" className="hover:text-ink-tertiary transition">
          x402 spec
        </a>
      </div>
    </div>
  );
}
