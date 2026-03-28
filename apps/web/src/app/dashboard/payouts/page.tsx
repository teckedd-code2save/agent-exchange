import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
import { isAuthBypassEnabled } from '@/lib/admin';
import { apiGet } from '@/lib/api-client';

type Balance = {
  testnetBalance: number;
  liveBalance: number;
  services: { id: string; name: string; status: string }[];
};

export default async function PayoutsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isAuthBypassEnabled()) redirect('/login');

  const provider = await apiGet<Balance>('/api/v1/provider/balance');
  const services = provider?.services ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Payouts</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Balances before settlement</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Studio is still early here. This page is the right home for payouts, balances, and merchant receipts once live settlement is switched on.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Testnet balance</p>
          <p className="mt-3 text-4xl font-semibold text-sky-300">{provider?.testnetBalance ?? '0'}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live balance</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-300">{provider?.liveBalance ?? '0'}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Services tied to this operator</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {services.map((svc) => (
            <span key={svc.id} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {svc.name} · {svc.status}
            </span>
          ))}
          {services.length === 0 && <p className="text-sm text-slate-500">No services registered yet.</p>}
        </div>
      </section>
    </main>
  );
}
