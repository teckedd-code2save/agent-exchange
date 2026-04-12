import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthBypassEnabled } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';
import type { ProviderAnalyticsResponse, ProviderAnalyticsService } from '@/lib/types/studio';

const STATUS_STYLES: Record<string, string> = {
  live:    'pill-live',
  testnet: 'pill-testnet',
  sandbox: 'pill-sandbox',
  draft:   'pill-draft',
  paused:  'pill-paused',
};

function StatCard({
  label,
  value,
  sub,
  accent = 'white',
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'white' | 'green' | 'brand' | 'amber';
}) {
  const valueClass =
    accent === 'green' ? 'text-accent-green' :
    accent === 'brand' ? 'text-brand-gradient' :
    accent === 'amber' ? 'text-accent-amber' :
    'text-white';

  return (
    <div className="card-glow rounded-2xl p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id && !isAuthBypassEnabled()) redirect('/login');

  const data = await apiGet<ProviderAnalyticsResponse>('/api/v1/provider/analytics');

  /* ── Empty state ─────────────────────────────────────────── */
  if (!data || !data.services?.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">Studio Overview</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">No services yet</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-ink-secondary">
              Register your first paid API to get a sandbox proxy endpoint and start testing the
              HTTP 402 payment loop.
            </p>
          </div>
          <Link
            href="/dashboard/services/new"
            className="btn-brand w-fit shrink-0 px-5 py-2.5 text-sm"
          >
            Register service
          </Link>
        </div>

        {/* Empty card */}
        <div className="rounded-2xl border border-dashed border-dim bg-surface-800/40 px-8 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-750 text-3xl">
            ⬡
          </div>
          <h2 className="text-lg font-semibold text-white">Nothing here yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-secondary">
            Once you register a service, this page shows revenue, API calls, latency, and quick
            links into the gateway tester.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/services/new" className="btn-brand px-6 py-2.5 text-sm">
              Create your first service
            </Link>
            <Link href="/marketplace" className="btn-outline px-6 py-2.5 text-sm">
              Browse marketplace
            </Link>
          </div>
        </div>

        {/* Quick-start card */}
        <div className="mt-6 rounded-2xl border border-brand-500/20 bg-brand-500/6 p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Quick start</p>
          <p className="mb-4 text-sm text-ink-secondary">
            Register → test in sandbox → graduate to testnet with real USDC from Circle faucet
          </p>
          <div className="code-block text-[11px]">
            <span className="text-ink-muted">POST </span>
            <span className="text-brand-300">/api/v1/provider/services</span>
            {'\n'}
            <span className="text-ink-muted">→ sandbox proxy ready in &lt; 2s</span>
            {'\n'}
            <span className="text-ink-muted">GET </span>
            <span className="text-accent-amber">/api/v1/faucet/testnet-info</span>
            {'\n'}
            <span className="text-ink-muted">→ 20 USDC on Base Sepolia from Circle</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Populated state ─────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">Studio Overview</p>
          <h1 className="mt-1.5 text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
          {isAuthBypassEnabled() && (
            <p className="mt-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              Dev auth bypass active — services attached to local dev provider
            </p>
          )}
        </div>
        <Link href="/dashboard/services/new" className="btn-brand w-fit shrink-0 px-5 py-2.5 text-sm">
          + New service
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="30-Day Revenue"
          value={`$${data.summary.totalRevenue}`}
          sub="USDC + fiat combined"
          accent="green"
        />
        <StatCard
          label="30-Day API Calls"
          value={data.summary.totalCallsLast30d.toLocaleString()}
          sub="across all services"
        />
        <StatCard
          label="Active Services"
          value={data.summary.serviceCount}
          sub="sandbox + testnet + live"
          accent="brand"
        />
      </div>

      {/* Services grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Your services</h2>
        <Link href="/dashboard/services" className="text-xs text-brand-400 hover:text-brand-300 transition">
          View all →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.services.map((service: ProviderAnalyticsService) => (
          <div key={service.serviceId} className="card-glow group flex flex-col rounded-2xl p-5">
            {/* Service header */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-white">{service.name}</h3>
                  <span className={`${STATUS_STYLES[service.status] ?? 'pill-draft'} rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider`}>
                    {service.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-ink-muted">
                  /proxy/{service.studioSlug}
                </p>
              </div>
              <Link
                href={`/dashboard/services/${service.studioSlug}`}
                className="shrink-0 text-xs font-semibold text-brand-400 opacity-0 transition group-hover:opacity-100 hover:text-brand-300"
              >
                Manage →
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface-850 px-4 py-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-muted">Calls (30d)</p>
                <p className="mt-1 text-sm font-semibold text-white">{service.stats.callsLast30d.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-muted">Success</p>
                <p className="mt-1 text-sm font-semibold text-accent-green">{service.stats.successRate}%</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-muted">Revenue</p>
                <p className="mt-1 text-sm font-semibold text-accent-green">${service.stats.revenueUsd}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Avg. latency: {service.stats.avgLatencyMs}ms</span>
              <Link
                href={`/dashboard/gateway?service=${service.studioSlug}`}
                className="text-brand-400 transition hover:text-brand-300"
              >
                Test in gateway →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
