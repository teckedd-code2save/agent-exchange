import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function getAnalytics(cookieStore: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/v1/provider/analytics`, {
      headers: { Cookie: cookieStore },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); const userId = user?.id;
  if (!userId) redirect('/login');

  const { cookies } = await import('next/headers');
  const cookieString = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const data = await getAnalytics(cookieString);

  if (!data || !data.services?.length) {
    return (
      <main className="max-w-5xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Studio Overview</h1>
        <div className="bg-slate-900 rounded-xl p-12 text-center border border-slate-800">
          <h2 className="text-xl font-semibold mb-3">No Services Registered</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Register your first paid API to get a sandbox proxy endpoint and start testing the Studio payment loop.
          </p>
          <Link
            href="/dashboard/services/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50 bg-slate-50 text-slate-900 shadow hover:bg-slate-50/90 h-10 px-6 py-2"
          >
            Register Service
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Studio Overview</h1>
        <Link
          href="/dashboard/services/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 bg-slate-50 text-slate-900 shadow hover:bg-slate-50/90 h-9 px-4 py-2"
        >
          New Service
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-1">30-Day Revenue</h3>
          <p className="text-3xl font-bold text-emerald-400">${data.summary.totalRevenue}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-1">30-Day API Calls</h3>
          <p className="text-3xl font-bold text-white">{data.summary.totalCallsLast30d.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Active Services</h3>
          <p className="text-3xl font-bold text-white">{data.summary.serviceCount}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">Your Services</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.services.map((service: any) => (
          <div key={service.serviceId} className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {service.name}
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    service.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' :
                    service.status === 'testnet' ? 'bg-amber-500/20 text-amber-400' :
                    service.status === 'sandbox' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {service.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">mpp.studio/api/v1/proxy/{service.studioSlug}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-auto pt-6 border-t border-slate-800/50">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Calls (30d)</p>
                <p className="text-sm font-semibold">{service.stats.callsLast30d.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Success Rate</p>
                <p className="text-sm font-semibold text-emerald-400">{service.stats.successRate}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Revenue</p>
                <p className="text-sm font-semibold text-emerald-400">${service.stats.revenueUsd}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
               <div className="text-xs text-slate-500">
                 Latency: {service.stats.avgLatencyMs}ms
               </div>
               <Link href={`/dashboard/services/${service.studioSlug}`} className="ml-auto text-sm text-blue-400 hover:text-blue-300 font-medium">
                 Manage →
               </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
