import { prisma } from '@/lib/db';
import { TxStatusBadge, PaymentBadge } from '@/components/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage() {
  const [transactions, volumeByMethod] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        service: { select: { name: true, slug: true } },
        organisation: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.$queryRaw<Array<{ paymentMethod: string; total: string; count: bigint }>>`
      SELECT "paymentMethod", SUM("grossAmount")::text AS total, COUNT(*)::bigint AS count
      FROM transactions
      WHERE status = 'settled'
      GROUP BY "paymentMethod"
      ORDER BY SUM("grossAmount") DESC
    `,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Transactions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Last 200 transactions across the platform</p>
      </div>

      {/* Volume by payment method */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {volumeByMethod.map((v) => (
          <div key={v.paymentMethod} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <PaymentBadge method={v.paymentMethod} />
              <span className="text-xs text-gray-500">{Number(v.count)} txns</span>
            </div>
            <p className="text-lg font-bold text-white font-mono">{Number(v.total).toFixed(4)}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Org</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/marketplace/${tx.service.slug}`} className="text-indigo-400 hover:underline font-medium">
                    {tx.service.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{tx.organisation?.name ?? '—'}</td>
                <td className="px-4 py-3"><PaymentBadge method={tx.paymentMethod} /></td>
                <td className="px-4 py-3 font-mono text-gray-200 text-xs">{Number(tx.grossAmount).toFixed(6)} <span className="text-gray-600">{tx.currency}</span></td>
                <td className="px-4 py-3 font-mono text-gray-600 text-xs">{Number(tx.exchangeFee).toFixed(6)}</td>
                <td className="px-4 py-3 font-mono text-green-400 text-xs">{Number(tx.netAmount).toFixed(6)}</td>
                <td className="px-4 py-3"><TxStatusBadge status={tx.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
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
