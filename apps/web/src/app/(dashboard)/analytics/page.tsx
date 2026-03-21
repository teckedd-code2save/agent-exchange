import { repos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [gmv, adminStats] = await Promise.all([
    repos.transactions.getGmv(thirtyDaysAgo),
    repos.analytics.getAdminStats(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-gray-400">Last 30 days</p>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Gross Volume" value={`${gmv.gross} USDC`} />
        <StatCard label="Exchange Fees" value={`${gmv.fees} USDC`} />
        <StatCard label="Transactions" value={gmv.count} />
        <StatCard label="Active Services" value={adminStats.activeServiceCount} />
        <StatCard label="Unique Agent Wallets" value={adminStats.uniqueAgentWallets} />
        <StatCard label="Discovery Queries" value={adminStats.discoveryVolume} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
