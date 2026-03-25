import Link from 'next/link';

type ServiceContract = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  pricing: {
    type: string;
    config: { amount?: string; currency?: string };
  };
  payment: {
    methods: string[];
    challengeEndpoint: string;
  };
  proxy: {
    endpoint: string;
    environment: string;
  };
  stats: {
    totalCalls: number;
    callsThisMonth: number;
    avgRating: number | null;
    reviewCount: number;
  };
  recentReviews: Array<{ rating: number; comment: string | null; createdAt: string }>;
};

async function getContract(slug: string): Promise<ServiceContract | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/v1/services/${slug}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<ServiceContract>;
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const contract = await getContract(params.slug);

  if (!contract) {
    return (
      <main className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
          <h1 className="text-2xl font-semibold text-white">Service not found</h1>
          <p className="mt-3 text-sm text-slate-400">The contract could not be loaded from the Studio API.</p>
          <Link href="/dashboard/services" className="mt-6 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
            Back to services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Service Contract</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{contract.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{contract.description}</p>
        </div>
        <Link
          href={`/dashboard/gateway?service=${params.slug}`}
          className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
        >
          Test in Studio
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Invocation surface</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Proxy endpoint</p>
              <p className="mt-2 break-all rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 font-mono text-sm text-sky-300">
                {contract.proxy.endpoint}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Challenge endpoint</p>
              <p className="mt-2 break-all rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 font-mono text-sm text-slate-200">
                {contract.payment.challengeEndpoint}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pricing</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {contract.pricing.config.amount ?? '0.01'} {contract.pricing.config.currency ?? 'USDC'}
                </p>
                <p className="text-sm text-slate-400">{contract.pricing.type.replace('_', ' ')} pricing</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Payments</p>
                <p className="mt-3 text-lg font-semibold text-white">{contract.payment.methods.join(', ')}</p>
                <p className="text-sm text-slate-400">Current environment: {contract.proxy.environment}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold text-white">Signals</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Total calls</dt>
                <dd className="text-white">{contract.stats.totalCalls}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Calls this month</dt>
                <dd className="text-white">{contract.stats.callsThisMonth}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Average rating</dt>
                <dd className="text-white">{contract.stats.avgRating ?? 'No ratings yet'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Reviews</dt>
                <dd className="text-white">{contract.stats.reviewCount}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold text-white">Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {contract.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {tag}
                </span>
              ))}
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                {contract.category}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Recent reviews</h2>
        {contract.recentReviews.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No verified reviews yet. Run the proxy flow and start collecting signals.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {contract.recentReviews.map((review) => (
              <article key={`${review.createdAt}-${review.rating}`} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{review.rating}/5</p>
                  <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{review.comment ?? 'No written review.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
