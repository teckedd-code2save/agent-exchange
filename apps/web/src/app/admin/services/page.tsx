import { requireAdminUser } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';

type AdminService = {
  id: string; name: string; description: string; category: string; status: string;
  provider: { email: string };
  _count: { calls: number };
};

export default async function AdminServicesPage() {
  await requireAdminUser();
  const payload = await apiGet<{ results: AdminService[] }>('/api/v1/admin/services');
  const services = payload?.results ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-white">All Services</h1>
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70">
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="px-5 py-4">Service</th>
              <th className="px-5 py-4">Provider</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Calls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {services.map((svc) => (
              <tr key={svc.id}>
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{svc.name}</p>
                  <p className="text-xs text-slate-500">{svc.category}</p>
                </td>
                <td className="px-5 py-4 text-slate-300">{svc.provider.email}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{svc.status}</span></td>
                <td className="px-5 py-4 text-slate-300">{svc._count.calls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
