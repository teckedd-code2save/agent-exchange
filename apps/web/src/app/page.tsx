import Link from 'next/link';

/* ── Static data ───────────────────────────────────────────── */

const tickerItems = [
  { dot: 'bg-brand-400',  text: 'Coinbase + Cloudflare launch the x402 Foundation — May 2025' },
  { dot: 'bg-accent-cyan', text: 'HTTP 402: from forgotten status code to AI payment standard' },
  { dot: 'bg-accent-green', text: 'Circle USDC testnet faucet now live on 12+ networks' },
  { dot: 'bg-accent-amber', text: 'Stripe adds native x402 support in developer preview' },
  { dot: 'bg-brand-400',  text: 'Base Sepolia processes 50k+ testnet micropayments daily' },
  { dot: 'bg-accent-cyan', text: 'MPP Studio: sandbox → testnet → live in one platform' },
  { dot: 'bg-accent-purple', text: 'AI agents now represent 18%+ of paid API traffic — growing' },
  { dot: 'bg-accent-green', text: 'x402 SDK hits 10k npm downloads within first month' },
];

const stats = [
  { value: '<3ms',  label: 'Challenge issued' },
  { value: '12+',   label: 'Payment networks' },
  { value: 'x402 + MPP', label: 'Dual protocol' },
  { value: '$0.001', label: 'Min. transaction' },
];

const steps = [
  {
    number: '01',
    env: 'Sandbox',
    pill: 'pill-sandbox',
    title: 'Test with fake money',
    body: 'Register any API. Get a studio proxy endpoint instantly. Fire real HTTP 402 flows without touching a blockchain. Validate your contract, latency, and error handling before a single cent moves.',
    code: 'POST /api/v1/provider/services\n→ studioSlug: "my-api"\n→ 402 proxy ready in < 2s',
    codeColor: 'text-blue-300',
  },
  {
    number: '02',
    env: 'Testnet',
    pill: 'pill-testnet',
    title: 'Real USDC, zero risk',
    body: 'Graduate to Base Sepolia. Claim 20 free USDC from the Circle faucet. Run real EIP-712 signed micropayments verified by the Coinbase CDP facilitator. Same code, real chain.',
    code: 'GET /api/v1/faucet/testnet-info\n→ Circle faucet: 20 USDC / 2h\n→ Network: base-sepolia',
    codeColor: 'text-amber-300',
  },
  {
    number: '03',
    env: 'Live',
    pill: 'pill-live',
    title: 'Agents pay, you get paid',
    body: 'Promote to live. Your service appears in the discovery registry. Agents find it, negotiate 402, pay in USDC or Stripe, and call autonomously. Revenue flows to your wallet with each receipt.',
    code: 'GET /api/v1/discovery?env=live\n→ Listed. Agents can call.\n→ Payment-Receipt: rcpt_…',
    codeColor: 'text-emerald-300',
  },
];

const features = [
  {
    icon: '⚡',
    title: 'Instant 402 challenges',
    body: 'The proxy generates a signed challenge in under 3ms. No webhook latency, no blockchain round-trip at issuance.',
  },
  {
    icon: '🔒',
    title: 'Sandbox-first testing',
    body: 'Full 402 flow — challenge, credential, receipt — all with fake USDC. No wallet, no gas, no real money required.',
  },
  {
    icon: '🌐',
    title: 'x402 + MPP native',
    body: 'Accept the Coinbase/Cloudflare x402 standard and the broader MPP protocol simultaneously. Any compliant client works.',
  },
  {
    icon: '🤖',
    title: 'Machine-readable contracts',
    body: 'Every service exposes pricing, endpoints, and invocation hints in structured JSON. Agents know what they\'re buying before they call.',
  },
  {
    icon: '📊',
    title: 'Live call analytics',
    body: 'See every 402 challenge issued, solved, and converted. Track latency, success rate, and revenue per service in real time.',
  },
  {
    icon: '🪙',
    title: 'USDC native, Stripe fallback',
    body: 'Accept USDC on Base (x402), Tempo stablecoin rails, or Stripe for fiat. Swap rails without touching your API code.',
  },
];

const quotes = [
  {
    text: 'HTTP 402 was designed for this — a native payment layer for the programmable internet. We\'re just making it real.',
    author: 'Coinbase Developer Platform',
    year: '2025',
    color: 'brand-400',
    border: 'border-brand-500/30',
    glow: 'rgba(0,82,255,0.12)',
  },
  {
    text: 'The next phase of the internet won\'t be browse-and-click. Machines will negotiate, pay, and interact autonomously.',
    author: 'Cloudflare AI Blog',
    year: '2025',
    color: 'accent-cyan',
    border: 'border-cyan-500/25',
    glow: 'rgba(34,211,238,0.10)',
  },
  {
    text: 'The hardest part of building paid APIs isn\'t the payment — it\'s the testing. Once testing is easy, everything else follows.',
    author: 'MPP Studio',
    year: '2025',
    color: 'accent-green',
    border: 'border-emerald-500/25',
    glow: 'rgba(16,185,129,0.10)',
  },
];

const protocolFlow = [
  { dir: '→', method: 'GET', path: '/api/v1/proxy/dalle-gen/v1/create', color: 'text-ink-secondary' },
  { dir: '←', status: '402 Payment Required', color: 'text-amber-400' },
  { code: 'WWW-Authenticate: Payment challenge="ch_a1b2c3d4", method="x402",\n  amount="0.01", currency="USDC", expires="…"', color: 'text-blue-300' },
  { dir: '→', method: 'GET', path: '/api/v1/proxy/dalle-gen/v1/create', color: 'text-ink-secondary' },
  { code: 'X-Payment: eyJzY2hlbWUiOiJleGFjdCIsInNpZ25hdHVyZSI6Ii4uLiJ9', color: 'text-purple-300' },
  { dir: '←', status: '200 OK', color: 'text-emerald-400' },
  { code: 'Payment-Receipt: rcpt_9x8y7z6w', color: 'text-emerald-300' },
];

/* ── Sub-components ────────────────────────────────────────── */

function StatusDot({ alive = true }: { alive?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {alive && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${alive ? 'bg-emerald-400' : 'bg-gray-600'}`} />
    </span>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-900 text-ink-primary overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 nav-blur border-b border-dim">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 shadow-[0_0_12px_rgba(0,82,255,0.6)]">
              <span className="text-[11px] font-black text-white leading-none">402</span>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              MPP<span className="text-brand-400">Studio</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {[
              { href: '/marketplace', label: 'Discovery' },
              { href: '/dashboard/gateway', label: 'Gateway' },
              { href: '/dashboard', label: 'Dashboard' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3.5 py-2 text-ink-tertiary transition hover:text-white hover:bg-white/5"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-ink-tertiary hover:text-white transition px-3 py-2">
              Sign in
            </Link>
            <Link href="/signup" className="btn-brand px-5 py-2.5 text-sm">
              Start building
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Dot grid */}
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-100" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_480px] lg:py-32 xl:gap-20">
          {/* Left — headline */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <div className="mb-6 flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
              <StatusDot />
              x402 + MPP · Base Sepolia + Mainnet
            </div>

            <h1 className="text-white-gradient text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              The payment layer<br />
              for AI services.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-ink-secondary sm:text-lg">
              Build paid APIs with HTTP 402. Test with fake money in sandbox,
              graduate to real USDC on Base, and get discovered by agents that
              pay automatically.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard/services/new" className="btn-brand px-7 py-3 text-sm">
                Register a service →
              </Link>
              <Link href="/marketplace" className="btn-outline px-7 py-3 text-sm">
                Browse marketplace
              </Link>
            </div>

            {/* Micro-trust signals */}
            <div className="mt-10 flex flex-wrap items-center gap-5 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> No wallet needed for sandbox</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 20 free USDC on Base Sepolia</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Stripe + x402 + Tempo</span>
            </div>
          </div>

          {/* Right — protocol card */}
          <div className="card-glow rounded-2xl p-0.5 shadow-card lg:max-w-none">
            <div className="rounded-[calc(1rem-2px)] bg-surface-800 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-dim px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-ink-muted">402 Protocol Flow</span>
                </div>
                <span className="pill-sandbox rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  sandbox
                </span>
              </div>

              {/* Protocol lines */}
              <div className="px-5 py-4 space-y-1 font-mono text-[12px] leading-relaxed">
                {protocolFlow.map((line, i) => (
                  <div key={i} className={line.color}>
                    {'dir' in line ? (
                      <span>
                        <span className="text-ink-muted select-none mr-2">{line.dir}</span>
                        {'method' in line && <span className="text-brand-300">{line.method} </span>}
                        {'status' in line && <span className="font-semibold">{line.status}</span>}
                        {'path' in line && <span className="text-ink-secondary">{line.path}</span>}
                      </span>
                    ) : (
                      <pre className="whitespace-pre-wrap break-all">{(line as { code: string; color: string }).code}</pre>
                    )}
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div className="flex items-center gap-2 border-t border-dim bg-surface-850 px-5 py-3 text-xs text-ink-muted">
                <StatusDot />
                <span>Challenge verified · receipt issued · upstream proxied</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TICKER ─────────────────────────────────────── */}
      <div className="border-y border-dim bg-surface-850 py-3">
        <div className="ticker-wrap">
          <div className="ticker-track">
            {/* doubled for seamless loop */}
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2.5 px-8 text-xs text-ink-secondary">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dot}`} />
                {item.text}
                <span className="mx-4 text-ink-muted">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="border-b border-dim bg-surface-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-dim sm:grid-cols-4 sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center px-6 py-8 text-center">
              <p className="text-brand-gradient text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROTOCOL STEPS ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Sandbox to production in three steps</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink-secondary">
            Every paid API goes through the same loop. The only thing that changes is the money.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.number} className="card-glow relative flex flex-col rounded-2xl p-6">
              {/* Step number + connector */}
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-750 font-mono text-sm font-bold text-brand-300">
                  {step.number}
                </span>
                {idx < steps.length - 1 && (
                  <div className="hidden h-px flex-1 bg-gradient-to-r from-brand-500/30 to-transparent lg:block" />
                )}
                <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${step.pill}`}>
                  {step.env}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mb-5 text-sm leading-6 text-ink-secondary">{step.body}</p>

              <div className="code-block mt-auto">
                <pre className={`${step.codeColor} whitespace-pre-wrap`}>{step.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="border-t border-dim bg-surface-850 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-cyan">Built for the protocol</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Everything the machine economy needs</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card-glow group rounded-2xl p-6 transition-all">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-750 text-xl transition group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-6 text-ink-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTES ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">From the ecosystem</p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Why HTTP 402, why now</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.author}
              className="card-glow flex flex-col rounded-2xl p-6"
              style={{ boxShadow: `0 0 40px ${q.glow}` }}
            >
              {/* Quote mark */}
              <div className={`mb-4 text-4xl font-serif leading-none text-${q.color} opacity-60`}>"</div>
              <blockquote className="flex-1 text-sm leading-7 text-ink-primary italic">
                {q.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-between border-t border-dim pt-4">
                <span className={`text-xs font-semibold text-${q.color}`}>{q.author}</span>
                <span className="text-[10px] text-ink-muted">{q.year}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="border-t border-dim bg-surface-850 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-brand">
            <span className="font-mono text-base font-black text-white">402</span>
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Start building today.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-ink-secondary">
            Register your API, get a sandbox proxy endpoint, and run your first 402
            payment flow in under five minutes. No credit card, no blockchain wallet required to start.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className="btn-brand px-8 py-3 text-sm">
              Create free account
            </Link>
            <Link href="/marketplace" className="btn-outline px-8 py-3 text-sm">
              Explore the marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-dim px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-500">
              <span className="font-mono text-[8px] font-black text-white">402</span>
            </div>
            <span className="text-sm font-semibold text-white">
              MPP<span className="text-brand-400">Studio</span>
            </span>
            <span className="text-xs text-ink-muted">— The payment layer for AI services</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-ink-muted">
            <Link href="/marketplace" className="hover:text-white transition">Discovery</Link>
            <Link href="/dashboard" className="hover:text-white transition">Studio</Link>
            <Link href="/dashboard/gateway" className="hover:text-white transition">Gateway</Link>
            <a href="https://www.x402.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">x402 Spec</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
