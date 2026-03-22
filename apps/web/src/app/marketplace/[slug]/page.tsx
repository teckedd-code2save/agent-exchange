import Link from 'next/link';
import { notFound } from 'next/navigation';
import { repos } from '@/lib/db';
import {
  TierBadge,
  StatusBadge,
  ProtocolBadge,
  PaymentBadge,
  ClassificationBadge,
  HealthScore,
} from '@/components/Badge';

export const dynamic = 'force-dynamic';

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await repos.services.findBySlug(params.slug);
  if (!service) notFound();

  const latestHealth = service.healthChecks[0];
  const uptimePct =
    service.healthChecks.length > 0
      ? (service.healthChecks.filter((h) => h.status === 'up').length / service.healthChecks.length) * 100
      : null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Agent<span className="text-indigo-400">Exchange</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition-colors">← Marketplace</Link>
          <Link href="/login" className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">Sign in</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <TierBadge tier={service.listingTier} />
              <StatusBadge status={service.status} />
              <ClassificationBadge classification={service.dataClassification} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{service.name}</h1>
            {service.tagline && <p className="text-lg text-gray-400">{service.tagline}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {service.categories.map((c) => (
                <Link
                  key={c.category}
                  href={`/marketplace?category=${c.category}`}
                  className="text-xs px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded transition-colors"
                >
                  {c.category}
                </Link>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right space-y-2">
            <HealthScore score={service.healthScore} />
            {service.verifiedAt && (
              <p className="text-xs text-gray-500">Verified {new Date(service.verifiedAt).toLocaleDateString()}</p>
            )}
            <a
              href={service.serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-indigo-400 hover:underline"
            >
              {service.serviceUrl} ↗
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card title="About">
              <p className="text-gray-300 leading-relaxed">{service.description}</p>
            </Card>

            {/* Endpoints & Pricing */}
            {service.endpoints.length > 0 && (
              <Card title="Endpoints & Pricing">
                <div className="space-y-4">
                  {service.endpoints.map((ep) => (
                    <div key={ep.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-1.5 py-0.5 bg-indigo-600/20 text-indigo-300 rounded">
                            {ep.method}
                          </span>
                          <code className="text-sm text-gray-200">{ep.path}</code>
                        </div>
                        {ep.rateLimitRpm && (
                          <span className="text-xs text-gray-500">{ep.rateLimitRpm} rpm</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{ep.name}{ep.description ? ` — ${ep.description}` : ''}</p>
                      {ep.pricing.length > 0 && (
                        <div className="space-y-1">
                          {ep.pricing.map((price) => (
                            <div key={price.id} className="flex items-center justify-between text-xs text-gray-400">
                              <span className="font-mono">
                                {Number(price.amount).toFixed(price.pricingModel === 'per_token' ? 8 : 6)} {price.currency}
                              </span>
                              <span className="text-gray-600">
                                {price.pricingModel.replace('_', ' ')}
                                {price.unit ? ` / ${price.unit}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Protocols */}
            {service.protocols.length > 0 && (
              <Card title="Supported Protocols">
                <div className="space-y-3">
                  {service.protocols.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <ProtocolBadge protocol={p.protocol} />
                      {p.specUrl && (
                        <a href={p.specUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
                          Spec ↗
                        </a>
                      )}
                      {p.mcpServerUrl && (
                        <a href={p.mcpServerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
                          MCP Server ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* MPP Quick-start */}
            <Card title="Agent Quick-start">
              <p className="text-xs text-gray-400 mb-3">Call any endpoint — the server issues an HTTP 402 MPP challenge automatically.</p>
              <pre className="bg-gray-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">
{`# 1. Discover the service
GET /api/v1/services/${service.slug}

# 2. Call an endpoint (expect 402)
POST ${service.serviceUrl}${service.endpoints[0]?.path ?? '/v1/...'}

# 3. Read the WWW-Authenticate header
# 4. Sign the credential with your Tempo wallet
# 5. Retry with Authorization: MPP <credential>
# Server returns receipt + response`}
              </pre>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Payment methods */}
            <Card title="Payment">
              <div className="space-y-2">
                {service.paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between">
                    <PaymentBadge method={pm.method} />
                    <span className="text-xs text-gray-500">{pm.intent}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* SLA */}
            {service.slaCommitment && (
              <Card title="SLA">
                <div className="space-y-2 text-sm">
                  <Row label="Uptime target" value={`${service.slaCommitment.uptimeTargetPct}%`} />
                  {service.slaCommitment.maxLatencyMs && (
                    <Row label="Max latency" value={`${service.slaCommitment.maxLatencyMs}ms`} />
                  )}
                  {service.slaCommitment.statusPageUrl && (
                    <a href={service.slaCommitment.statusPageUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-indigo-400 hover:underline">
                      Status page ↗
                    </a>
                  )}
                  {service.slaCommitment.supportEmail && (
                    <p className="text-xs text-gray-500">{service.slaCommitment.supportEmail}</p>
                  )}
                </div>
              </Card>
            )}

            {/* Health */}
            <Card title="Health">
              <div className="space-y-3">
                {latestHealth && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Current</span>
                    <span className={`font-medium ${latestHealth.status === 'up' ? 'text-green-400' : latestHealth.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {latestHealth.status}
                    </span>
                  </div>
                )}
                {latestHealth?.latencyMs && (
                  <Row label="Latency" value={`${latestHealth.latencyMs}ms`} />
                )}
                {uptimePct !== null && (
                  <Row label="Uptime (10 checks)" value={`${uptimePct.toFixed(0)}%`} />
                )}
                <div className="flex gap-1 mt-2">
                  {service.healthChecks.map((h, i) => (
                    <div
                      key={i}
                      title={`${h.status} — ${new Date(h.checkedAt).toLocaleTimeString()}`}
                      className={`flex-1 h-2 rounded-sm ${
                        h.status === 'up' ? 'bg-green-500' : h.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600">Last {service.healthChecks.length} checks</p>
              </div>
            </Card>

            {/* Geo restrictions */}
            {service.geoRestrictions.length > 0 && (
              <Card title="Geo Restrictions">
                {service.geoRestrictions.map((r) => (
                  <div key={r.id} className="text-xs text-gray-400">
                    <span className="capitalize">{r.restrictionType}</span>: {r.regions.join(', ')}
                  </div>
                ))}
              </Card>
            )}

            {service.llmsTxtUrl && (
              <a
                href={service.llmsTxtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs text-center text-indigo-400 hover:border-indigo-500/40 transition-all"
              >
                📄 llms.txt — machine-readable spec
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-medium">{value}</span>
    </div>
  );
}
