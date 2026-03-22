import Link from 'next/link';
import { repos, prisma } from '@/lib/db';
import { TierBadge, StatusBadge, TxStatusBadge, PaymentBadge, HealthScore } from '@/components/Badge';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [serviceList, gmv, adminStats, recentTx] = await Promise.all([
    repos.services.list({ limit: 100 }),
    repos.transactions.getGmv(thirtyDaysAgo),
    repos.analytics.getAdminStats(),
    prisma.transaction.findMany({
      include: { service: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  const byTier = serviceList.data.reduce<Record<string, number>>((acc, s) => {
    acc[s.listingTier] = (acc[s.listingTier] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform health and activity at a glance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Services" value={adminStats.activeServiceCount} />
        <StatCard label="30d Volume" value={`${Number(gmv.gross).toFixed(4)}`} sub="USDC/USD settled" color="text-green-400" />
        <StatCard label="Transactions (30d)" value={gmv.count} />
        <StatCard label="Agent Wallets" value={adminStats.uniqueAgentWallets} sub="unique" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services by tier */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">By Tier</h2>
            <Link href="/dashboard/services" className="text-xs text-indigo-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {['featured', 'proprietary_data', 'verified', 'free'].map((tier) => (
              <div key={tier} className="flex items-center justify-between">
                <TierBadge tier={tier} />
                <span className="text-sm font-medium text-gray-300">{byTier[tier] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent services */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Services</h2>
            <Link href="/dashboard/services" className="text-xs text-indigo-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {serviceList.data.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                <HealthScore score={s.healthScore} />
                <Link href={`/dashboard/services/${s.slug}`} className="flex-1 font-medium text-sm hover:text-indigo-300 transition-colors truncate">
                  {s.name}
                </Link>
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
          <Link href="/dashboard/transactions" className="text-xs text-indigo-400 hover:underline">View all</Link>
        </div>
        <div className="space-y-1">
          {recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800/50 transition-colors text-sm">
              <PaymentBadge method={tx.paymentMethod} />
              <Link href={`/dashboard/services/${tx.service.slug}`} className="flex-1 text-gray-300 hover:text-indigo-300 transition-colors truncate">
                {tx.service.name}
              </Link>
              <span className="font-mono text-gray-300">{Number(tx.grossAmount).toFixed(4)} <span className="text-gray-600 text-xs">{tx.currency}</span></span>
              <TxStatusBadge status={tx.status} />
              <span className="text-xs text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {recentTx.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No transactions yet</p>}
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
