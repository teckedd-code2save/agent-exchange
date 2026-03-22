import { notFound } from 'next/navigation';
import Link from 'next/link';
import { repos, prisma } from '@/lib/db';
import { TierBadge, StatusBadge, ProtocolBadge, PaymentBadge, ClassificationBadge } from '@/components/Badge';

export const dynamic = 'force-dynamic';

export default async function ServiceManagePage({ params }: { params: { slug: string } }) {
  const [service, stats] = await Promise.all([
    repos.services.findBySlug(params.slug),
    prisma.serviceStatsDaily.findMany({
      where: {
        service: { slug: params.slug },
        date: { gte: new Date(Date.now() - 14 * 86400000) },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  if (!service) notFound();

  const maxCalls = Math.max(...stats.map((s) => s.endpointCalls), 1);
  const totalVolume = stats.reduce((sum, s) => sum + Number(s.totalVolume), 0);
  const totalCalls = stats.reduce((sum, s) => sum + s.endpointCalls, 0);
  const avgUptime = stats.length > 0
    ? stats.reduce((sum, s) => sum + Number(s.uptimePct ?? 100), 0) / stats.length
    : null;

  const latestHealth = service.healthChecks[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TierBadge tier={service.listingTier} />
            <StatusBadge status={service.status} />
            <ClassificationBadge classification={service.dataClassification} />
          </div>
          <h1 className="text-2xl font-bold">{service.name}</h1>
          {service.tagline && <p className="text-gray-400 mt-1">{service.tagline}</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/marketplace/${service.slug}`}
            className="px-3 py-2 text-sm border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            Public page ↗
          </Link>
          {service.status === 'active' && (
            <form action={`/api/v1/admin/services/${service.slug}/suspend`} method="POST">
              <button className="px-3 py-2 text-sm bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-lg transition-colors">
                Suspend
              </button>
            </form>
          )}
        </div>
      </div>

      {/* KPIs (14d) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="14d Calls" value={totalCalls.toLocaleString()} />
        <StatCard label="14d Volume" value={`${totalVolume.toFixed(4)}`} sub="USDC/USD" color="text-green-400" />
        <StatCard label="Health Score" value={`${service.healthScore}/100`} color={service.healthScore >= 95 ? 'text-green-400' : 'text-yellow-400'} />
        {avgUptime !== null && <StatCard label="Avg Uptime" value={`${avgUptime.toFixed(1)}%`} color={avgUptime >= 99 ? 'text-green-400' : 'text-yellow-400'} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Daily Calls (14d)</h2>
          {stats.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {stats.map((s) => (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-indigo-600/50 hover:bg-indigo-500/70 rounded-t transition-colors"
                    style={{ height: `${Math.round((s.endpointCalls / maxCalls) * 100)}%` }}
                    title={`${new Date(s.date).toLocaleDateString()}: ${s.endpointCalls} calls`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
          )}
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>{stats[0] ? new Date(stats[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
            <span>{stats.at(-1) ? new Date(stats.at(-1)!.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>

        {/* Health sidebar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Health (last 10)</h2>
          {latestHealth && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Current</span>
              <span className={`font-semibold ${latestHealth.status === 'up' ? 'text-green-400' : latestHealth.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                {latestHealth.status}
                {latestHealth.latencyMs && ` · ${latestHealth.latencyMs}ms`}
              </span>
            </div>
          )}
          <div className="flex gap-1">
            {service.healthChecks.map((h, i) => (
              <div
                key={i}
                title={`${h.status}`}
                className={`flex-1 h-3 rounded-sm ${h.status === 'up' ? 'bg-green-500' : h.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}
              />
            ))}
          </div>
          {service.slaCommitment && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
              SLA: {String(service.slaCommitment.uptimeTargetPct)}% uptime target
              {service.slaCommitment.maxLatencyMs && ` · ${service.slaCommitment.maxLatencyMs}ms max`}
            </div>
          )}
        </div>
      </div>

      {/* Endpoints */}
      {service.endpoints.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Endpoints</h2>
          <div className="space-y-3">
            {service.endpoints.map((ep) => (
              <div key={ep.id} className="flex items-start justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-indigo-600/20 text-indigo-300 rounded">{ep.method}</span>
                    <code className="text-sm text-gray-200">{ep.path}</code>
                    <span className="text-xs text-gray-500">— {ep.name}</span>
                  </div>
                  {ep.pricing.length > 0 && (
                    <div className="flex gap-3">
                      {ep.pricing.map((p) => (
                        <span key={p.id} className="text-xs text-gray-500 font-mono">
                          {Number(p.amount).toFixed(6)} {p.currency} / {p.pricingModel.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {ep.rateLimitRpm && <span className="text-xs text-gray-600">{ep.rateLimitRpm} rpm</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocols & Payments */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Protocols</h2>
          <div className="flex flex-wrap gap-2">
            {service.protocols.map((p) => <ProtocolBadge key={p.protocol} protocol={p.protocol} />)}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Payment Methods</h2>
          <div className="flex flex-wrap gap-2">
            {service.paymentMethods.map((m) => <PaymentBadge key={m.method} method={m.method} />)}
          </div>
        </div>
      </div>

      {/* Service info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Row label="Service URL" value={service.serviceUrl} mono />
          <Row label="Registration" value={service.registrationType} />
          {service.verifiedAt && <Row label="Verified" value={new Date(service.verifiedAt).toLocaleDateString()} />}
          {service.llmsTxtUrl && <Row label="llms.txt" value={service.llmsTxtUrl} mono />}
        </div>
        <p className="text-sm text-gray-400 mt-4">{service.description}</p>
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-gray-200 mt-0.5 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}
