import { redirect } from 'next/navigation';
import { prisma } from '@agent-exchange/db';
import { createSupabaseServerClient } from '@/lib/supabase';
import { isAuthBypassEnabled } from '@/lib/admin';

async function getBalances(userId: string) {
  return prisma.provider.findUnique({
    where: { userId },
    select: {
      testnetBalance: true,
      liveBalance: true,
      services: {
        select: { id: true, name: true, status: true },
      },
    },
  });
}

export default async function PayoutsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isAuthBypassEnabled()) {
    redirect('/login');
  }

  const provider = user ? await getBalances(user.id) : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Payouts</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Balances before settlement</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Studio is still early here. Today this page is best treated as a readiness panel for where testnet and live settlement will land once the promote flow becomes real.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Testnet balance</p>
          <p className="mt-3 text-4xl font-semibold text-sky-300">{provider ? String(provider.testnetBalance) : '0.0'}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live balance</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-300">{provider ? String(provider.liveBalance) : '0.0'}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">What this means today</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sandbox</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">No real settlement. Use the proxy tester to validate the loop without moving money.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Testnet</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">Testnet balances will matter once Tempo/Stripe promotion is switched on for providers.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">Live settlement is still ahead of us, but this page is the right home for payouts, balances, and merchant receipts.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Services tied to this operator</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(provider?.services ?? []).map((service) => (
            <span key={service.id} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {service.name} · {service.status}
            </span>
          ))}
          {(provider?.services ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No services registered yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
