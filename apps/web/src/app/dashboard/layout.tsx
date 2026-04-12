import Link from 'next/link';
import { NavLink } from '@/components/NavLink';
import { UserMenu } from '@/components/UserMenu';

const navSections = [
  {
    label: 'Operator',
    links: [
      { href: '/dashboard',              label: 'Overview',        exact: true,  icon: '◈' },
      { href: '/dashboard/services',     label: 'Services',        exact: false, icon: '⬡' },
      { href: '/dashboard/transactions', label: 'Transactions',    exact: false, icon: '⇄' },
      { href: '/dashboard/analytics',    label: 'Analytics',       exact: false, icon: '∿' },
      { href: '/dashboard/payouts',      label: 'Payouts',         exact: false, icon: '◎' },
    ],
  },
  {
    label: 'Developer',
    links: [
      { href: '/dashboard/gateway', label: 'Gateway Tester', exact: false, icon: '⚡' },
      { href: '/dashboard/wallet',  label: 'Wallet',         exact: false, icon: '◉' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-900 text-ink-primary">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-dim bg-surface-850 xl:w-60">
        {/* Logo */}
        <div className="border-b border-dim px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 shadow-[0_0_10px_rgba(0,82,255,0.5)]">
              <span className="font-mono text-[9px] font-black text-white leading-none">402</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              MPP<span className="text-brand-400">Studio</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.25em] text-ink-muted">
                {section.label}
              </p>
              {section.links.map(({ href, label, exact, icon }) => (
                <NavLink key={href} href={href} exact={exact}>
                  <span className="mr-2 text-[13px] opacity-60">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-dim px-3 py-3 space-y-0.5">
          <Link
            href="/marketplace"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-muted transition hover:bg-white/5 hover:text-ink-tertiary"
          >
            <span className="opacity-60">🌐</span> Discovery
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-muted transition hover:bg-white/5 hover:text-ink-tertiary"
          >
            <span className="opacity-60">⚙</span> Admin
          </Link>
          <div className="pt-2 border-t border-dim">
            <UserMenu />
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-surface-900">
        {children}
      </main>
    </div>
  );
}
