import Link from 'next/link';
import { repos } from '@/lib/db';
import { TierBadge, StatusBadge, HealthScore, ProtocolBadge, PaymentBadge } from '@/components/Badge';

export const dynamic = 'force-dynamic';

export default async function ServicesListPage() {
  const result = await repos.services.list({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">{result.meta.total} registered services</p>
        </div>
        <Link href="/dashboard/services/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
          + Register Service
        </Link>
      </div>

      {result.data.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">No services yet</p>
          <Link href="/dashboard/services/new" className="text-indigo-400 hover:underline text-sm">Register your first service</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {result.data.map((service) => (
            <Link
              key={service.id}
              href={`/dashboard/services/${service.slug}`}
              className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-xl transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold group-hover:text-indigo-300 transition-colors">{service.name}</span>
                  <span className="text-xs text-gray-600 font-mono">/{service.slug}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{service.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {service.protocols.map((p) => <ProtocolBadge key={p.protocol} protocol={p.protocol} />)}
                  {service.paymentMethods.map((m) => <PaymentBadge key={m.method} method={m.method} />)}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <HealthScore score={service.healthScore} />
                <TierBadge tier={service.listingTier} />
                <StatusBadge status={service.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
