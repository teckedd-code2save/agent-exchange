import { prisma } from '@/lib/db';
import { repos } from '@/lib/db';
import { TierBadge, StatusBadge, TxStatusBadge, PaymentBadge } from '@/components/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    serviceCount,
    orgCount,
    gmv,
    adminStats,
    servicesByStatus,
    recentTx,
    pendingPayouts,
    recentServices,
  ] = await Promise.all([
    prisma.service.count({ where: { deletedAt: null } }),
    prisma.organisation.count({ where: { deletedAt: null } }),
    repos.transactions.getGmv(thirtyDaysAgo),
    repos.analytics.getAdminStats(),
    prisma.service.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.transaction.findMany({
      include: { service: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.payout.count({ where: { status: 'pending' } }),
    prisma.service.findMany({
      where: { deletedAt: null },
      include: { organisation: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  const statusMap = Object.fromEntries(servicesByStatus.map((s) => [s.status, s._count.status]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide administration</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-800/40 rounded-lg">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
          <span className="text-xs text-red-400 font-semibold">Admin access</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Services" value={serviceCount} />
        <StatCard label="Organisations" value={orgCount} />
        <StatCard label="30d Gross Volume" value={`${Number(gmv.gross).toFixed(2)}`} sub="USDC/USD" color="text-green-400" />
        <StatCard label="30d Transactions" value={gmv.count} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Agent Wallets" value={adminStats.uniqueAgentWallets} />
        <StatCard label="Discovery (30d)" value={adminStats.discoveryVolume} />
        <StatCard label="30d Fees Collected" value={`${Number(gmv.fees).toFixed(4)}`} color="text-yellow-400" />
        <StatCard label="Pending Payouts" value={pendingPayouts} color={pendingPayouts > 0 ? 'text-yellow-400' : 'text-white'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services by status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Services by Status</h2>
            <Link href="/admin/services" className="text-xs text-indigo-400 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-2">
            {(['active', 'draft', 'suspended', 'deprecated'] as const).map((status) => (
              <div key={status} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                <StatusBadge status={status} />
                <span className="text-lg font-bold text-gray-200">{statusMap[status] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent services */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Latest Services</h2>
            <Link href="/admin/services" className="text-xs text-indigo-400 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentServices.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.organisation.name}</p>
                </div>
                <TierBadge tier={s.listingTier} />
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Transactions</h2>
          <Link href="/admin/transactions" className="text-xs text-indigo-400 hover:underline">View all →</Link>
        </div>
        <div className="space-y-1">
          {recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800/50 text-sm">
              <PaymentBadge method={tx.paymentMethod} />
              <span className="flex-1 text-gray-300 truncate">{tx.service.name}</span>
              <span className="font-mono text-gray-300">{Number(tx.grossAmount).toFixed(6)} <span className="text-gray-600 text-xs">{tx.currency}</span></span>
              <TxStatusBadge status={tx.status} />
              <span className="text-xs text-gray-600 w-20 text-right">{new Date(tx.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}
