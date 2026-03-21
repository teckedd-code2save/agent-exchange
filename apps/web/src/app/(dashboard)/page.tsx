import { repos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const [serviceList, categories] = await Promise.all([
    repos.services.list({ limit: 5 }),
    repos.services.getCategories(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Services" value={serviceList.meta.total} />
        <StatCard label="Categories" value={categories.length} />
        <StatCard label="Health" value="100%" />
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Services</h2>
        {serviceList.data.length === 0 ? (
          <p className="text-gray-400 text-sm">No services yet. Register your first service.</p>
        ) : (
          <ul className="space-y-2">
            {serviceList.data.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-800">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-gray-400">{s.slug}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  s.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
