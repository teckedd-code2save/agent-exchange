import Link from 'next/link';
import { getAppUrl } from '@/lib/env';
import type { DiscoveryServiceRecord } from '@/lib/types/studio';

async function getServices() {
  const baseUrl = getAppUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/discovery?env=sandbox`, {
      cache: 'no-store',
    });
    if (!res.ok) return { results: [] as DiscoveryServiceRecord[] };
    return res.json() as Promise<{ results: DiscoveryServiceRecord[] }>;
  } catch (err) {
    console.error('Discovery fetch error:', err);
    return { results: [] as DiscoveryServiceRecord[] };
  }
}

export default async function MarketplacePage() {
  const { results } = await getServices();

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Service Discovery</h1>
        <p className="text-slate-400 text-lg">Find MPP-compatible AI services for your agents.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 sticky top-8">
            <h3 className="font-bold text-white mb-4">Environment</h3>
            <div className="space-y-2 mb-8">
              {['Live', 'Testnet', 'Sandbox'].map((env) => (
                <label key={env} className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="env" defaultChecked={env === 'Sandbox'} className="w-4 h-4 rounded-full bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{env}</span>
                </label>
              ))}
            </div>

            <h3 className="font-bold text-white mb-4">Categories</h3>
            <div className="space-y-2">
              {['image-generation', 'text-generation', 'search', 'data'].map((cat) => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {results.length === 0 ? (
            <div className="bg-slate-900/30 rounded-xl p-20 text-center border border-dashed border-slate-800">
              <p className="text-slate-500">No services found in this environment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {results.map((service: DiscoveryServiceRecord) => (
                (() => {
                  const pricing = service.pricingConfig ?? {};
                  return (
                <div key={service.id} className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col hover:border-slate-700 transition-colors group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{service.name}</h3>
                      <p className="text-xs text-blue-500/80 font-semibold uppercase tracking-wider">{service.category}</p>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded">
                      {pricing.amount ?? '0.01'} {pricing.currency ?? 'USDC'}
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {service.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {service.totalCalls.toLocaleString()} calls
                    </span>
                    <Link href={`/marketplace/${service.studioSlug}`} className="text-sm font-semibold text-white hover:text-blue-400 flex items-center gap-1 transition-colors">
                      View Contract <span>→</span>
                    </Link>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
