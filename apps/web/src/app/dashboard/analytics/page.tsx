import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
import { isAuthBypassEnabled } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';

type ServiceStats = {
  serviceId: string;
  name: string;
  studioSlug: string;
  status: string;
  stats: {
    totalCallsAllTime: number;
    callsLast30d: number;
    successRate: number;
    paidCalls: number;
    revenueUsd: string;
    avgLatencyMs: number;
    byEnvironment: { sandbox: number; testnet: number; production: number };
  };
};

type AnalyticsResponse = {
  summary: { totalRevenue: string; totalCallsLast30d: number; serviceCount: number };
  services: ServiceStats[];
};

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isAuthBypassEnabled()) redirect('/login');

  const analytics = await apiGet<AnalyticsResponse>('/api/v1/provider/analytics');

  if (!analytics || !analytics.services.length) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h1 className="text-2xl font-semibold text-white">No analytics yet</h1>
          <p className="mt-3 text-sm text-slate-400">Register a service and run a few sandbox calls to start building your Studio signal layer.</p>
        </div>
      </main>
    );
  }

  const totals = {
    serviceCount: analytics.summary.serviceCount,
    totalCalls: analytics.summary.totalCallsLast30d,
    totalRevenue: analytics.summary.totalRevenue,
    sandboxCalls: analytics.services.reduce((s, svc) => s + svc.stats.byEnvironment.sandbox, 0),
    productionCalls: analytics.services.reduce((s, svc) => s + svc.stats.byEnvironment.production, 0),
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Analytics</p>
        <h1 className="mt-2 text-3xl font-bold text-white">See how your Studio services behave</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Calls, success rates, latency, and revenue across all your registered services in the last 30 days.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Services', value: totals.serviceCount, color: 'text-white' },
          { label: 'Calls (30d)', value: totals.totalCalls, color: 'text-white' },
          { label: 'Revenue proxy', value: totals.totalRevenue, color: 'text-emerald-300' },
          { label: 'Production calls', value: totals.productionCalls, color: 'text-sky-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
            <p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Per-service performance</h2>
        <div className="mt-5 grid gap-4">
          {analytics.services.map((svc) => (
            <article key={svc.serviceId} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{svc.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{svc.status}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">{svc.stats.callsLast30d} calls</span>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">{svc.stats.successRate}% success</span>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-300">{svc.stats.avgLatencyMs}ms avg</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revenue proxy</p>
                  <p className="mt-2 text-lg font-semibold text-white">{svc.stats.revenueUsd}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sandbox</p>
                  <p className="mt-2 text-lg font-semibold text-white">{svc.stats.byEnvironment.sandbox}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Production</p>
                  <p className="mt-2 text-lg font-semibold text-white">{svc.stats.byEnvironment.production}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
