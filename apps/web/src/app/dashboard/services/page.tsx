import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { isAuthBypassEnabled } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';
import type { ProviderServiceRecord } from '@/lib/types/studio';

function statusClasses(status: string) {
  if (status === 'live') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'testnet') return 'bg-amber-500/15 text-amber-300';
  if (status === 'sandbox') return 'bg-sky-500/15 text-sky-300';
  return 'bg-slate-800 text-slate-400';
}

export default async function ServicesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isAuthBypassEnabled()) redirect('/login');

  const payload = await apiGet<{ results?: ProviderServiceRecord[] }>('/api/v1/provider/services');
  const services = payload?.results ?? [];

  return (
    <main className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Service Registry</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Your MPP Studio services</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Register APIs, inspect their machine-readable contract, and jump straight into the Studio tester.
          </p>
          {!user && isAuthBypassEnabled() && (
            <p className="mt-2 text-sm text-amber-300">Auth bypass is active. New services will be saved under the local dev provider account.</p>
          )}
        </div>
        <Link
          href="/dashboard/services/new"
          className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
        >
          Register service
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h2 className="text-xl font-semibold text-white">No services yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
            Start with one endpoint in sandbox mode. MPP Studio will generate a proxy URL you can use to simulate 402 flows and validate your agent integration before real payments.
          </p>
          <Link
            href="/dashboard/services/new"
            className="mt-6 inline-flex rounded-full border border-sky-400/40 px-5 py-2.5 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/10"
          >
            Create your first service
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {services.map((service: ProviderServiceRecord) => {
            const pricing = service.pricingConfig ?? {};
            return (
              <section key={service.id} className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/20">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white">{service.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{service.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {tag}
                        </span>
                      ))}
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[280px] rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Contract summary</p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Pricing</dt>
                        <dd className="text-white">
                          {(pricing.amount ?? '0.01')} {(pricing.currency ?? 'USDC')} / {service.pricingType.replace('_', ' ')}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Payments</dt>
                        <dd className="text-white">{service.supportedPayments.join(', ')}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Calls logged</dt>
                        <dd className="text-white">{service._count?.calls ?? 0}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Studio proxy</p>
                    <p className="mt-2 break-all font-mono text-sm text-sky-300">
                      /api/v1/proxy/{service.studioSlug}
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-slate-500">
                      Upstream: {service.endpoint}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <Link
                      href={`/dashboard/gateway?service=${service.studioSlug}`}
                      className="rounded-full border border-sky-400/30 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/10"
                    >
                      Open tester
                    </Link>
                    <Link
                      href={`/dashboard/services/${service.studioSlug}`}
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/60"
                    >
                      View contract
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
