import { requireAdminUser } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';

type AdminOverview = {
  providerCount: number;
  serviceCount: number;
  callCount: number;
  recentServices: Array<{
    id: string; name: string; description: string; category: string; status: string;
    _count: { calls: number; reviews: number };
  }>;
};

export default async function AdminPage() {
  const { user, isOpenAdminMode } = await requireAdminUser();
  const overview = await apiGet<AdminOverview>('/api/v1/admin/overview');

  const draftCount = overview?.recentServices.filter((s) => s.status === 'draft').length ?? 0;
  const pausedCount = overview?.recentServices.filter((s) => s.status === 'paused').length ?? 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Admin Console</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Operate the Studio</h1>
      </div>

      {isOpenAdminMode && (
        <div className="rounded-3xl border border-amber-700/30 bg-amber-950/20 px-5 py-4 text-sm text-amber-200">
          `ADMIN_EMAILS` is not configured — admin console is open to any authenticated user. Lock this down before production.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Signed-in admin', value: user.email ?? 'Unknown', color: 'text-white text-lg' },
          { label: 'Providers', value: overview?.providerCount ?? 0, color: 'text-white text-3xl' },
          { label: 'Draft services', value: draftCount, color: 'text-amber-300 text-3xl' },
          { label: 'Paused services', value: pausedCount, color: 'text-rose-300 text-3xl' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
            <p className={`mt-3 font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Latest services</h2>
        <div className="mt-5 grid gap-4">
          {(overview?.recentServices ?? []).map((svc) => (
            <article key={svc.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{svc.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{svc.description}</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{svc.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>{svc.category}</span>
                <span>{svc._count.calls} calls</span>
                <span>{svc._count.reviews} reviews</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
