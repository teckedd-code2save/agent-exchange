import { prisma } from '@/lib/db';
import { TxStatusBadge, PaymentBadge } from '@/components/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: {
      service: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totals = transactions.reduce(
    (acc, t) => {
      acc.count++;
      if (t.status === 'settled') acc.settled += Number(t.grossAmount);
      if (t.status === 'pending') acc.pending++;
      if (t.status === 'failed') acc.failed++;
      return acc;
    },
    { count: 0, settled: 0, pending: 0, failed: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last 100 transactions across all services</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total" value={totals.count} />
        <StatCard label="Settled Volume" value={`${totals.settled.toFixed(4)}`} sub="USDC/USD" />
        <StatCard label="Pending" value={totals.pending} color="text-yellow-400" />
        <StatCard label="Failed" value={totals.failed} color="text-red-400" />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent Wallet</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/services/${tx.service.slug}`} className="text-indigo-400 hover:underline font-medium">
                    {tx.service.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <PaymentBadge method={tx.paymentMethod} />
                </td>
                <td className="px-4 py-3 font-mono text-gray-200">
                  {Number(tx.grossAmount).toFixed(6)} <span className="text-gray-500 text-xs">{tx.currency}</span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                  {Number(tx.exchangeFee).toFixed(6)}
                </td>
                <td className="px-4 py-3">
                  <TxStatusBadge status={tx.status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">
                  {tx.agentWalletAddress ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString()}{' '}
                  {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="text-center py-16 text-gray-500">No transactions yet</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}
