import Link from 'next/link';
import { Suspense } from 'react';
import { repos } from '@/lib/db';
import { ServiceCard } from '@/components/ServiceCard';
import { SearchInput } from '@/components/SearchInput';

export const dynamic = 'force-dynamic';

const PROTOCOLS = ['mpp', 'mcp', 'openapi', 'a2a', 'acp'];
const METHODS = ['tempo', 'stripe', 'lightning'];

const CLASSIFICATIONS = ['public', 'licensed', 'proprietary'];

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const protocol = typeof searchParams.protocol === 'string' ? searchParams.protocol : undefined;
  const method = typeof searchParams.method === 'string' ? searchParams.method : undefined;
  const classification = typeof searchParams.classification === 'string' ? searchParams.classification : undefined;
  const offset = typeof searchParams.offset === 'string' ? Number(searchParams.offset) : 0;
  const limit = 20;

  const [result, categories] = await Promise.all([
    repos.services.list({ q, category, protocol, method, classification, limit, offset }),
    repos.services.getCategories(),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { q, category, protocol, method, classification };
    const merged = { ...base, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/marketplace?${p.toString()}`;
  };

  const hasFilters = !!(q || category || protocol || method || classification);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Agent<span className="text-indigo-400">Exchange</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/login" className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">Sign in</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Filter sidebar */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Search</p>
              <Suspense>
                <SearchInput placeholder="Search services…" />
              </Suspense>
            </div>

            <FilterGroup title="Category">
              {categories.slice(0, 14).map(({ category: cat, count }) => (
                <FilterLink
                  key={cat}
                  href={buildUrl({ category: category === cat ? undefined : cat, offset: undefined })}
                  active={category === cat}
                  label={cat}
                  count={count}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Protocol">
              {PROTOCOLS.map((p) => (
                <FilterLink
                  key={p}
                  href={buildUrl({ protocol: protocol === p ? undefined : p, offset: undefined })}
                  active={protocol === p}
                  label={p.toUpperCase()}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Payment">
              {METHODS.map((m) => (
                <FilterLink
                  key={m}
                  href={buildUrl({ method: method === m ? undefined : m, offset: undefined })}
                  active={method === m}
                  label={m}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Data">
              {CLASSIFICATIONS.map((c) => (
                <FilterLink
                  key={c}
                  href={buildUrl({ classification: classification === c ? undefined : c, offset: undefined })}
                  active={classification === c}
                  label={c}
                />
              ))}
            </FilterGroup>

            {hasFilters && (
              <Link href="/marketplace" className="block text-xs text-indigo-400 hover:underline">
                ← Clear all filters
              </Link>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Service Marketplace</h1>
              <p className="text-sm text-gray-500 mt-1">
                {result.meta.total} service{result.meta.total !== 1 ? 's' : ''}
                {hasFilters ? ' matching filters' : ' available'}
              </p>
            </div>
            <Link
              href="/dashboard/services/new"
              className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
            >
              + List Service
            </Link>
          </div>

          {result.data.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <p className="text-lg mb-2">No services found</p>
              <p className="text-sm">Try adjusting your filters</p>
              <Link href="/marketplace" className="text-indigo-400 hover:underline text-sm mt-4 block">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.data.map((s) => (
                <ServiceCard
                  key={s.id}
                  name={s.name}
                  slug={s.slug}
                  tagline={s.tagline}
                  description={s.description}
                  listingTier={s.listingTier}
                  dataClassification={s.dataClassification}
                  healthScore={s.healthScore}
                  categories={s.categories}
                  protocols={s.protocols}
                  paymentMethods={s.paymentMethods}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {result.meta.total > limit && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {offset > 0 && (
                <Link
                  href={buildUrl({ offset: String(Math.max(0, offset - limit)) })}
                  className="px-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-gray-500">
                {offset + 1}–{Math.min(offset + limit, result.meta.total)} of {result.meta.total}
              </span>
              {offset + limit < result.meta.total && (
                <Link
                  href={buildUrl({ offset: String(offset + limit) })}
                  className="px-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? 'bg-indigo-600/20 text-indigo-300'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && <span className="text-xs text-gray-600">{count}</span>}
    </Link>
  );
}
