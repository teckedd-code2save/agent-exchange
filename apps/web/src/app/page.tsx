import Link from 'next/link';

const pillars = [
  {
    title: 'Sandbox first',
    body: 'Register an API, get a Studio proxy endpoint, and test 402 payment flows with fake money before anything touches a chain.',
  },
  {
    title: 'Machine-readable contracts',
    body: 'Every service exposes pricing, payment methods, and invocation hints so agents know what they are buying before they call.',
  },
  {
    title: 'Graduate with confidence',
    body: 'Move from sandbox to testnet and live with the same mental model, analytics, and operational surface.',
  },
];

const commands = [
  'POST /api/v1/provider/services',
  'GET /api/v1/discovery?env=sandbox',
  'POST /api/v1/proxy/:studioSlug/your/path',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.14),_transparent_22%),#020617] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">MPP Studio</p>
            <p className="mt-2 text-sm text-slate-400">The testnet for paid AI services.</p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/marketplace" className="rounded-full border border-white/10 px-4 py-2 text-slate-300 transition hover:border-sky-400/40 hover:text-white">
              Discovery
            </Link>
            <Link href="/dashboard" className="rounded-full bg-sky-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-300">
              Open Studio
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Provider sandbox to live payments
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Build a paid API that agents can test, trust, and call.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              MPP Studio gives service providers a safe sandbox for HTTP 402 flows, a machine-readable discovery surface for agents, and a clean path to real payments when the integration is ready.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/dashboard/services/new" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                Register a service
              </Link>
              <Link href="/dashboard/gateway" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-sky-400/50 hover:bg-white/5">
                Test the payment flow
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-sky-950/20 backdrop-blur">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Studio Loop</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">From registration to paid call</h2>
                </div>
                <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-300">Sandbox</span>
              </div>
              <div className="space-y-3">
                {commands.map((command) => (
                  <div key={command} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-slate-200">
                    {command}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-slate-400">
                Start with fake credentials, validate your proxy contract, then swap in Tempo or Stripe when the service is ready to leave sandbox.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-t border-white/10 py-10 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{pillar.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
