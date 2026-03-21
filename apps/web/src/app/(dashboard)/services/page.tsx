import Link from 'next/link';
import { repos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ServicesListPage() {
  const result = await repos.services.list({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Link
          href="/dashboard/services/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          Register Service
        </Link>
      </div>

      {result.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No services registered yet.</p>
          <Link href="/dashboard/services/new" className="text-indigo-400 hover:underline mt-2 block">
            Register your first service
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.map((service) => (
            <div key={service.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{service.name}</span>
                  <span className="text-xs text-gray-500">/{service.slug}</span>
                </div>
                <p className="text-sm text-gray-400 truncate mt-0.5">{service.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-gray-400">{service.healthScore}/100</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  service.status === 'active'
                    ? 'bg-green-900 text-green-300'
                    : service.status === 'draft'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-red-900 text-red-300'
                }`}>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-500">
        {result.meta.total} service{result.meta.total !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
