import { requireAdminUser } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';
import type { Call } from '@/types';

export default async function AdminTransactionsPage() {
  await requireAdminUser();
  const payload = await apiGet<{ results: Call[] }>('/api/v1/admin/calls');
  const calls = payload?.results ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-white">All Transactions</h1>
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70">
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="px-5 py-4">Service</th>
              <th className="px-5 py-4">Path</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Env</th>
              <th className="px-5 py-4">Latency</th>
              <th className="px-5 py-4">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {calls.map((call) => (
              <tr key={call.id}>
                <td className="px-5 py-4 text-white">{call.service.name}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-300">{call.method} {call.path}</td>
                <td className="px-5 py-4 text-slate-300">{call.status}</td>
                <td className="px-5 py-4 text-slate-300">{call.environment}</td>
                <td className="px-5 py-4 text-slate-300">{call.latencyMs}ms</td>
                <td className="px-5 py-4 text-slate-400">{new Date(call.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
