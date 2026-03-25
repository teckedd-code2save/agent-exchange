import { redirect } from 'next/navigation';
import { prisma } from '@agent-exchange/db';
import { createSupabaseServerClient } from '@/lib/supabase';

async function getRecentCalls(userId: string) {
  const provider = await prisma.provider.findUnique({
    where: { userId },
    select: {
      id: true,
      services: { select: { id: true, name: true, studioSlug: true } },
    },
  });

  if (!provider) {
    return [];
  }

  const serviceIds = provider.services.map((service) => service.id);
  if (serviceIds.length === 0) {
    return [];
  }

  return prisma.call.findMany({
    where: { serviceId: { in: serviceIds } },
    include: {
      service: {
        select: { name: true, studioSlug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

function statusClasses(status: number) {
  if (status >= 200 && status < 300) return 'text-emerald-300 bg-emerald-500/10';
  if (status === 402) return 'text-amber-300 bg-amber-500/10';
  if (status >= 500) return 'text-rose-300 bg-rose-500/10';
  return 'text-slate-300 bg-slate-800';
}

export default async function TransactionsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const calls = await getRecentCalls(user.id);

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Transactions</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Recent Studio calls</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Studio records every proxied call here, including challenge loops, response status, latency, and the environment where the request ran.
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <h2 className="text-2xl font-semibold text-white">No calls recorded yet</h2>
          <p className="mt-3 text-sm text-slate-400">Use the proxy tester or hit one of your sandbox endpoints to start building a transaction log.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/70">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-950/70">
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Path</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Environment</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Latency</th>
                <th className="px-5 py-4">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {calls.map((call) => (
                <tr key={call.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{call.service.name}</p>
                    <p className="text-xs text-slate-500">{call.service.studioSlug}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-300">{call.method} {call.path}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(call.status)}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{call.environment}</td>
                  <td className="px-5 py-4 text-slate-300">{String(call.amount)} {call.currency}</td>
                  <td className="px-5 py-4 text-slate-300">{call.latencyMs}ms</td>
                  <td className="px-5 py-4 text-slate-400">{new Date(call.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
