import Link from 'next/link';
import { repos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [serviceList, categories, gmv, agentWallets] = await Promise.all([
    repos.services.list({ limit: 6 }),
    repos.services.getCategories(),
    repos.transactions.getGmv(thirtyDaysAgo),
    repos.transactions.getUniqueAgentWallets(),
  ]);

  const featuredServices = serviceList.data.filter((s) => s.listingTier === 'featured').slice(0, 3);
  const latestServices = serviceList.data.filter((s) => s.listingTier !== 'featured').slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Agent<span className="text-indigo-400">Exchange</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition-colors">Marketplace</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/login" className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">Sign in</Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
          Protocol-native · MPP 402 · USDC payments
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          The marketplace for<br />autonomous AI agents
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Discover, evaluate, and pay for third-party APIs and data services — using the MPP 402 protocol with USDC or Stripe, without human checkout friction.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/marketplace" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors">Browse Services</Link>
          <Link href="/dashboard/services/new" className="px-8 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-semibold transition-colors">List Your API</Link>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatPill label="Services" value={serviceList.meta.total} />
          <StatPill label="Categories" value={categories.length} />
          <StatPill label="Agent Wallets" value={agentWallets} />
          <StatPill label="30d Volume" value={`${Number(gmv.gross).toFixed(2)} USDC`} />
        </div>
      </section>

      {featuredServices.length > 0 && (
        <section className="px-6 pb-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Featured Services</h2>
            <Link href="/marketplace?tier=featured" className="text-sm text-indigo-400 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredServices.map((s) => <ServicePreview key={s.id} service={s} />)}
          </div>
        </section>
      )}

      {latestServices.length > 0 && (
        <section className="px-6 pb-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recently Added</h2>
            <Link href="/marketplace" className="text-sm text-indigo-400 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {latestServices.map((s) => <ServicePreview key={s.id} service={s} />)}
          </div>
        </section>
      )}

      <section className="px-6 py-16 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Built for autonomous agents</h2>
          <p className="text-gray-400">No OAuth, no checkout pages. Agents pay per-call using the MPP 402 protocol.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Step n={1} title="Discover" description="Query the registry by category, protocol, or payment method. Get structured JSON back." />
          <Step n={2} title="Challenge" description="Agent calls the endpoint. Server issues an HTTP 402 MPP challenge with payment details." />
          <Step n={3} title="Pay & Access" description="Agent submits a signed credential with Tempo (USDC) or Stripe. Server issues a receipt." />
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link href="/marketplace" className="hover:text-gray-300 transition-colors">Marketplace</Link>
          <Link href="/api/v1/services" className="hover:text-gray-300 transition-colors">API</Link>
          <Link href="/llms.txt" className="hover:text-gray-300 transition-colors">llms.txt</Link>
          <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
          <Link href="/admin" className="hover:text-gray-300 transition-colors">Admin</Link>
        </div>
        <p>Agent Exchange — protocol-native AI agent marketplace</p>
      </footer>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 bg-gray-900 rounded-xl border border-gray-800">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function ServicePreview({ service }: { service: { id: string; name: string; slug: string; tagline?: string | null; listingTier: string; categories: Array<{ category: string }> } }) {
  const tierColor: Record<string, string> = { featured: 'text-yellow-300', proprietary_data: 'text-purple-300', verified: 'text-blue-300', free: 'text-gray-400' };
  return (
    <Link href={`/marketplace/${service.slug}`} className="p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-indigo-500/40 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white group-hover:text-indigo-300 transition-colors">{service.name}</span>
        <span className={`text-xs font-medium ${tierColor[service.listingTier] ?? 'text-gray-400'}`}>{service.listingTier.replace('_', ' ')}</span>
      </div>
      {service.tagline && <p className="text-xs text-gray-400 mb-3">{service.tagline}</p>}
      <div className="flex flex-wrap gap-1">
        {service.categories.slice(0, 3).map((c) => (
          <span key={c.category} className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">{c.category}</span>
        ))}
      </div>
    </Link>
  );
}

function Step({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <div className="p-5 bg-gray-900 rounded-xl border border-gray-800">
      <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-sm font-bold mb-4">{n}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
