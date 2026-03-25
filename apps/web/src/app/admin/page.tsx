import { prisma } from '@agent-exchange/db';
import { requireAdminUser } from '@/lib/admin';

async function getAdminOverview() {
  const [providers, services, calls] = await Promise.all([
    prisma.provider.count(),
    prisma.service.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { calls: true, reviews: true } } },
      take: 8,
    }),
    prisma.call.findMany({
      orderBy: { createdAt: 'desc' },
      include: { service: { select: { name: true } } },
      take: 12,
    }),
  ]);

  return {
    providerCount: providers,
    serviceCount: services.length,
    services,
    calls,
    draftCount: services.filter((service) => service.status === 'draft').length,
    pausedCount: services.filter((service) => service.status === 'paused').length,
  };
}

export default async function AdminPage() {
  const { user, isOpenAdminMode } = await requireAdminUser();
  const overview = await getAdminOverview();

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Admin Console</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Operate the Studio</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Review service readiness, keep an eye on recent traffic, and catch stalled services before they become a trust problem for providers or agents.
        </p>
      </div>

      {isOpenAdminMode && (
        <div className="rounded-3xl border border-amber-700/30 bg-amber-950/20 px-5 py-4 text-sm text-amber-200">
          `ADMIN_EMAILS` is not configured, so the admin console is currently open to any authenticated user in this environment. Lock that down before production.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Signed-in admin</p>
          <p className="mt-3 text-lg font-semibold text-white">{user.email ?? 'Unknown'}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Providers</p>
          <p className="mt-3 text-3xl font-semibold text-white">{overview.providerCount}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Draft services</p>
          <p className="mt-3 text-3xl font-semibold text-amber-300">{overview.draftCount}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Paused services</p>
          <p className="mt-3 text-3xl font-semibold text-rose-300">{overview.pausedCount}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Latest services</h2>
          <div className="mt-5 grid gap-4">
            {overview.services.map((service) => (
              <article key={service.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{service.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{service.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {service.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>{service.category}</span>
                  <span>{service._count.calls} calls</span>
                  <span>{service._count.reviews} reviews</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Recent traffic</h2>
          <div className="mt-5 space-y-3">
            {overview.calls.map((call) => (
              <div key={call.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-white">{call.service.name}</p>
                  <span className="text-xs text-slate-500">{call.environment}</span>
                </div>
                <p className="mt-2 font-mono text-xs text-slate-300">{call.method} {call.path}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Status {call.status}</span>
                  <span>{call.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
