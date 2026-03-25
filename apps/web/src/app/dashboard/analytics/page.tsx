import { redirect } from 'next/navigation';
import { prisma } from '@agent-exchange/db';
import { createSupabaseServerClient } from '@/lib/supabase';
import { isAuthBypassEnabled } from '@/lib/admin';

async function getAnalytics(userId: string) {
  const provider = await prisma.provider.findUnique({
    where: { userId },
    include: {
      services: {
        include: {
          calls: {
            orderBy: { createdAt: 'desc' },
            take: 200,
          },
        },
      },
    },
  });

  if (!provider) {
    return null;
  }

  const services = provider.services.map((service) => {
    const calls = service.calls;
    const successes = calls.filter((call) => call.status >= 200 && call.status < 300).length;
    const averageLatency = calls.length
      ? Math.round(calls.reduce((sum, call) => sum + call.latencyMs, 0) / calls.length)
      : 0;
    const revenue = calls.reduce((sum, call) => sum + Number(call.amount), 0);

    return {
      id: service.id,
      name: service.name,
      studioSlug: service.studioSlug,
      status: service.status,
      calls: calls.length,
      successes,
      successRate: calls.length ? Math.round((successes / calls.length) * 100) : 0,
      averageLatency,
      revenue: revenue.toFixed(4),
      environments: {
        sandbox: calls.filter((call) => call.environment === 'sandbox').length,
        testnet: calls.filter((call) => call.environment === 'testnet').length,
        production: calls.filter((call) => call.environment === 'production').length,
      },
    };
  });

  const totalCalls = services.reduce((sum, service) => sum + service.calls, 0);
  const totalRevenue = services.reduce((sum, service) => sum + Number(service.revenue), 0);

  return {
    provider,
    services,
    totals: {
      serviceCount: services.length,
      totalCalls,
      totalRevenue: totalRevenue.toFixed(4),
      sandboxCalls: services.reduce((sum, service) => sum + service.environments.sandbox, 0),
      productionCalls: services.reduce((sum, service) => sum + service.environments.production, 0),
    },
  };
}

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isAuthBypassEnabled()) {
    redirect('/login');
  }

  const analytics = user ? await getAnalytics(user.id) : null;

  if (!analytics) {
    return (
      <main className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h1 className="text-2xl font-semibold text-white">No analytics yet</h1>
          <p className="mt-3 text-sm text-slate-400">Register a service and run a few sandbox calls to start building your Studio signal layer.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Analytics</p>
        <h1 className="mt-2 text-3xl font-bold text-white">See how your Studio services behave</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          This is the operator view: where calls are happening, how reliable the proxy loop feels, and whether your traffic is still mostly sandbox or already moving toward production.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Services</p>
          <p className="mt-3 text-3xl font-semibold text-white">{analytics.totals.serviceCount}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Calls</p>
          <p className="mt-3 text-3xl font-semibold text-white">{analytics.totals.totalCalls}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Revenue proxy</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">{analytics.totals.totalRevenue}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Production calls</p>
          <p className="mt-3 text-3xl font-semibold text-sky-300">{analytics.totals.productionCalls}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Environment mix</h2>
          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Sandbox</span>
                <span className="text-white">{analytics.totals.sandboxCalls}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-sky-400" style={{ width: `${analytics.totals.totalCalls ? (analytics.totals.sandboxCalls / analytics.totals.totalCalls) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Production</span>
                <span className="text-white">{analytics.totals.productionCalls}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${analytics.totals.totalCalls ? (analytics.totals.productionCalls / analytics.totals.totalCalls) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Operator note</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Studio is still strongest in sandbox mode today. If this panel shows all your traffic stuck there, that is okay. The next job is making the promote-to-testnet path feel just as easy as the first sandbox call.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Per-service performance</h2>
        <div className="mt-5 grid gap-4">
          {analytics.services.map((service) => (
            <article key={service.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{service.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{service.status}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">{service.calls} calls</span>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">{service.successRate}% success</span>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-300">{service.averageLatency}ms avg latency</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revenue proxy</p>
                  <p className="mt-2 text-lg font-semibold text-white">{service.revenue}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sandbox</p>
                  <p className="mt-2 text-lg font-semibold text-white">{service.environments.sandbox}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Production</p>
                  <p className="mt-2 text-lg font-semibold text-white">{service.environments.production}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
