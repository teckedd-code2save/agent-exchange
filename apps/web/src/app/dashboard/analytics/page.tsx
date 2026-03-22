import { repos, prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

  const [gmv, adminStats, topServices, dailyStats] = await Promise.all([
    repos.transactions.getGmv(thirtyDaysAgo),
    repos.analytics.getAdminStats(),
    repos.transactions.getTopServicesByVolume(thirtyDaysAgo, 6),
    prisma.serviceStatsDaily.findMany({
      where: { date: { gte: fourteenDaysAgo } },
      include: { service: { select: { name: true } } },
      orderBy: { date: 'asc' },
    }),
  ]);

  // Aggregate daily totals across all services
  const dailyTotals = dailyStats.reduce<Record<string, { calls: number; volume: number }>>((acc, s) => {
    const key = new Date(s.date).toISOString().split('T')[0]!;
    if (!acc[key]) acc[key] = { calls: 0, volume: 0 };
    const entry = acc[key] ?? { calls: 0, volume: 0 }; entry.calls += s.endpointCalls;
    entry.volume += Number(s.totalVolume); acc[key] = entry;
    return acc;
  }, {});

  const days = Object.entries(dailyTotals).sort(([a], [b]) => a.localeCompare(b));
  const maxCalls = Math.max(...days.map(([, d]) => d.calls), 1);

  // Top services with names
  const serviceNames = await prisma.service.findMany({
    where: { id: { in: topServices.map((s) => s.serviceId) } },
    select: { id: true, name: true, slug: true },
  });
  const nameMap = Object.fromEntries(serviceNames.map((s) => [s.id, s]));
  const maxVolume = Math.max(...topServices.map((s) => Number(s.volume)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="30d Gross Volume" value={`${Number(gmv.gross).toFixed(4)}`} sub="USDC/USD settled" color="text-green-400" />
        <StatCard label="30d Exchange Fees" value={`${Number(gmv.fees).toFixed(4)}`} sub="USDC/USD" color="text-yellow-400" />
        <StatCard label="30d Transactions" value={gmv.count} />
        <StatCard label="Active Services" value={adminStats.activeServiceCount} />
        <StatCard label="Unique Agent Wallets" value={adminStats.uniqueAgentWallets} />
        <StatCard label="30d Discovery Queries" value={adminStats.discoveryVolume} />
      </div>

      {/* Call volume chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">Daily API Calls (14d)</h2>
        {days.length > 0 ? (
          <>
            <div className="flex items-end gap-2 h-40">
              {days.map(([date, data]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100">{data.calls}</span>
                  <div
                    className="w-full bg-indigo-600/60 hover:bg-indigo-500 rounded-t transition-colors cursor-default"
                    style={{ height: `${Math.round((data.calls / maxCalls) * 100)}%`, minHeight: '4px' }}
                    title={`${date}: ${data.calls.toLocaleString()} calls · ${data.volume.toFixed(4)} volume`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>{days[0]?.[0] ? new Date(days[0]![0]!).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
              <span>{days.at(-1)?.[0] ? new Date(days.at(-1)![0]!).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
        )}
      </div>

      {/* Top services by volume */}
      {topServices.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">Top Services by Volume (30d)</h2>
          <div className="space-y-3">
            {topServices.map((s) => {
              const svc = nameMap[s.serviceId];
              const pct = (Number(s.volume) / maxVolume) * 100;
              return (
                <div key={s.serviceId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 font-medium">{svc?.name ?? s.serviceId}</span>
                    <span className="font-mono text-gray-400">{Number(s.volume).toFixed(4)} USDC</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
