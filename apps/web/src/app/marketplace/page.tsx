import Link from 'next/link';
import { getAppUrl } from '@/lib/env';
import type { DiscoveryServiceRecord } from '@/lib/types/studio';

async function getServices() {
  const baseUrl = getAppUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/discovery?env=sandbox`, { cache: 'no-store' });
    if (!res.ok) return { results: [] as DiscoveryServiceRecord[] };
    return res.json() as Promise<{ results: DiscoveryServiceRecord[] }>;
  } catch (err) {
    console.error('Discovery fetch error:', err);
    return { results: [] as DiscoveryServiceRecord[] };
  }
}

const ENV_LABELS: Record<string, { label: string; pill: string }> = {
  live:    { label: 'Live',    pill: 'pill-live' },
  testnet: { label: 'Testnet', pill: 'pill-testnet' },
  sandbox: { label: 'Sandbox', pill: 'pill-sandbox' },
};

const CATEGORIES = ['image-generation', 'text-generation', 'search', 'data', 'audio', 'code'];

export default async function MarketplacePage() {
  const { results } = await getServices();

  return (
    <div className="min-h-screen bg-surface-900 text-ink-primary">
      {/* Header */}
      <header className="nav-blur sticky top-0 z-40 border-b border-dim px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500">
                <span className="font-mono text-[9px] font-black text-white">402</span>
              </div>
              <span className="text-sm font-bold text-white">MPP<span className="text-brand-400">Studio</span></span>
            </Link>
            <span className="text-ink-muted">/</span>
            <span className="text-sm text-ink-tertiary">Discovery</span>
          </div>
          <Link href="/dashboard" className="btn-brand px-4 py-2 text-xs">
            Open Studio
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* Page title */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">Service Discovery</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Find MPP-compatible AI services
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-secondary">
            Every service listed here speaks HTTP 402. Agents discover, negotiate, and
            pay automatically — no human in the loop.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className="w-full shrink-0 lg:w-56 xl:w-64">
            <div className="sticky top-24 rounded-2xl border border-dim bg-surface-800 p-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-muted">Environment</p>
              <div className="mb-6 space-y-1.5">
                {['Live', 'Testnet', 'Sandbox'].map((env) => (
                  <label key={env} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
                    <input
                      type="radio"
                      name="env"
                      defaultChecked={env === 'Sandbox'}
                      className="h-3.5 w-3.5 accent-brand-500"
                    />
                    <span className="text-sm text-ink-secondary">{env}</span>
                    {env === 'Live' && (
                      <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </label>
                ))}
              </div>

              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-muted">Category</p>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded accent-brand-500" />
                    <span className="text-sm text-ink-secondary">{cat}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-brand-500/20 bg-brand-500/8 p-4">
                <p className="text-xs font-semibold text-brand-300">x402 testnet</p>
                <p className="mt-1 text-[11px] leading-5 text-ink-muted">
                  Get 20 free USDC on Base Sepolia from the Circle faucet to test live payments.
                </p>
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center rounded-lg bg-brand-500/20 px-3 py-1.5 text-[11px] font-semibold text-brand-300 transition hover:bg-brand-500/30"
                >
                  Get testnet USDC →
                </a>
              </div>
            </div>
          </aside>

          {/* ── Results ──────────────────────────────────────── */}
          <div className="flex-1">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dim bg-surface-800/40 px-6 py-20 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-750 text-2xl">
                  🔍
                </div>
                <p className="font-semibold text-white">No services in this environment</p>
                <p className="mt-2 max-w-sm text-sm text-ink-secondary">
                  Register an API in the Studio and set it live to appear here.
                </p>
                <Link href="/dashboard/services/new" className="btn-brand mt-6 px-6 py-2.5 text-sm">
                  Register a service
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((service: DiscoveryServiceRecord) => {
                  const pricing = (service.pricingConfig ?? {}) as { amount?: string; currency?: string };
                  const envInfo = ENV_LABELS[service.status] ?? ENV_LABELS.sandbox;
                  return (
                    <article
                      key={service.id}
                      className="card-glow group flex flex-col rounded-2xl p-5 transition-all"
                    >
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-white transition group-hover:text-brand-300">
                            {service.name}
                          </h2>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                            {service.category}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className={`${envInfo.pill} rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider`}>
                            {envInfo.label}
                          </span>
                          <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            {pricing.amount ?? '0.01'} {pricing.currency ?? 'USDC'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="line-clamp-2 text-sm leading-6 text-ink-secondary">
                        {service.description}
                      </p>

                      {/* Tags */}
                      {service.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {service.tags.slice(0, 4).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-md border border-dim bg-surface-750 px-2 py-0.5 text-[10px] text-ink-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-dim pt-3">
                        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                          <span>{service.totalCalls.toLocaleString()} calls</span>
                          {service.supportedPayments?.length > 0 && (
                            <span className="flex items-center gap-1">
                              {service.supportedPayments.slice(0, 2).map((p: string) => (
                                <span key={p} className="rounded bg-surface-750 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-muted">
                                  {p}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/marketplace/${service.studioSlug}`}
                          className="flex items-center gap-1 text-xs font-semibold text-brand-300 transition hover:text-brand-200"
                        >
                          View contract <span className="transition group-hover:translate-x-0.5">→</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
