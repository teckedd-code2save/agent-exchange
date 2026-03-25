import { prisma } from '@agent-exchange/db';
import { requireAdminUser } from '@/lib/admin';

async function getCallsForAdmin() {
  return prisma.call.findMany({
    include: {
      service: {
        select: {
          name: true,
          studioSlug: true,
          provider: {
            select: { email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

function statusTone(status: number) {
  if (status >= 200 && status < 300) return 'bg-emerald-500/10 text-emerald-300';
  if (status === 402) return 'bg-amber-500/10 text-amber-300';
  if (status >= 500) return 'bg-rose-500/10 text-rose-300';
  return 'bg-slate-800 text-slate-300';
}

export default async function AdminTransactionsPage() {
  await requireAdminUser();
  const calls = await getCallsForAdmin();
  type AdminCall = (typeof calls)[number];

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Traffic Log</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Cross-service request ledger</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          This is the operator view across every provider. It’s useful for catching repeated 402 loops, stalled environments, or services that should not be live yet.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70">
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="px-5 py-4">Service</th>
              <th className="px-5 py-4">Provider</th>
              <th className="px-5 py-4">Request</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Latency</th>
              <th className="px-5 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {calls.map((call: AdminCall) => (
              <tr key={call.id}>
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{call.service.name}</p>
                  <p className="text-xs text-slate-500">{call.service.studioSlug}</p>
                </td>
                <td className="px-5 py-4 text-slate-300">{call.service.provider.email}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-300">{call.method} {call.path}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(call.status)}`}>
                    {call.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-300">{call.paymentType} · {String(call.amount)} {call.currency}</td>
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
