import { prisma } from '@/lib/db';
import { TierBadge, StatusBadge, ProtocolBadge, HealthScore } from '@/components/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminServicesPage({ searchParams }: PageProps) {
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : undefined;

  const services = await prisma.service.findMany({
    where: {
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter as 'active' | 'draft' | 'suspended' | 'deprecated' } : {}),
    },
    include: {
      organisation: { select: { name: true, slug: true } },
      categories: true,
      protocols: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const statuses = ['', 'active', 'draft', 'suspended', 'deprecated'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">{services.length} services{statusFilter ? ` with status "${statusFilter}"` : ''}</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {statuses.map((s) => (
          <Link
            key={s || 'all'}
            href={s ? `/admin/services?status=${s}` : '/admin/services'}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === s || (!statusFilter && !s)
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-gray-400 hover:bg-gray-800 border border-transparent'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Protocols</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Health</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <Link href={`/marketplace/${s.slug}`} className="font-medium text-indigo-400 hover:underline">{s.name}</Link>
                    <p className="text-xs text-gray-600 font-mono">/{s.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.organisation.name}</td>
                <td className="px-4 py-3"><TierBadge tier={s.listingTier} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.protocols.map((p) => <ProtocolBadge key={p.protocol} protocol={p.protocol} />)}
                  </div>
                </td>
                <td className="px-4 py-3"><HealthScore score={s.healthScore} /></td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {s.status !== 'active' && (
                      <form action={`/api/v1/admin/services/${s.slug}/approve`} method="POST">
                        <button className="text-xs px-2 py-1 bg-green-900/40 hover:bg-green-900/60 border border-green-800 text-green-300 rounded transition-colors">
                          Approve
                        </button>
                      </form>
                    )}
                    {s.status === 'active' && (
                      <form action={`/api/v1/admin/services/${s.slug}/suspend`} method="POST">
                        <button className="text-xs px-2 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded transition-colors">
                          Suspend
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <div className="text-center py-16 text-gray-500">No services found</div>
        )}
      </div>
    </div>
  );
}
