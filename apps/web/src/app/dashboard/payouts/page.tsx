import { prisma } from '@/lib/db';
import { PayoutStatusBadge, PaymentBadge } from '@/components/Badge';

export const dynamic = 'force-dynamic';

export default async function PayoutsPage() {
  const payouts = await prisma.payout.findMany({
    include: { organisation: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totals = payouts.reduce(
    (acc, p) => {
      acc.gross += Number(p.grossAmount);
      acc.fees += Number(p.exchangeFee);
      acc.net += Number(p.netAmount);
      return acc;
    },
    { gross: 0, fees: 0, net: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Revenue distribution to service providers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Gross Payouts" value={totals.gross.toFixed(4)} sub="USDC" />
        <StatCard label="Exchange Fees" value={totals.fees.toFixed(4)} sub="USDC" color="text-yellow-400" />
        <StatCard label="Net to Providers" value={totals.net.toFixed(4)} sub="USDC" color="text-green-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {payouts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-200">{p.organisation.name}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-mono text-gray-200">{Number(p.grossAmount).toFixed(4)} <span className="text-gray-600 text-xs">{p.currency}</span></td>
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{Number(p.exchangeFee).toFixed(4)}</td>
                <td className="px-4 py-3 font-mono text-green-400 font-medium">{Number(p.netAmount).toFixed(4)}</td>
                <td className="px-4 py-3"><PaymentBadge method={p.paymentMethod} /></td>
                <td className="px-4 py-3"><PayoutStatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {payouts.length === 0 && (
          <div className="text-center py-16 text-gray-500">No payouts yet</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}
