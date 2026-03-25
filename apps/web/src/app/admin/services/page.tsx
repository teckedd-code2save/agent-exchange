import { revalidatePath } from 'next/cache';
import { prisma } from '@agent-exchange/db';
import { requireAdminUser } from '@/lib/admin';

async function updateServiceStatus(formData: FormData) {
  'use server';

  await requireAdminUser();

  const serviceId = String(formData.get('serviceId') ?? '');
  const status = String(formData.get('status') ?? '');

  if (!serviceId || !['draft', 'sandbox', 'testnet', 'live', 'paused'].includes(status)) {
    return;
  }

  await prisma.service.update({
    where: { id: serviceId },
    data: { status: status as 'draft' | 'sandbox' | 'testnet' | 'live' | 'paused' },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/services');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/services');
  revalidatePath('/marketplace');
}

async function getServicesForAdmin() {
  return prisma.service.findMany({
    include: {
      provider: {
        select: {
          email: true,
          testnetBalance: true,
          liveBalance: true,
        },
      },
      _count: {
        select: { calls: true, reviews: true },
      },
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });
}

function statusTone(status: string) {
  if (status === 'live') return 'bg-emerald-500/10 text-emerald-300';
  if (status === 'testnet') return 'bg-amber-500/10 text-amber-300';
  if (status === 'sandbox') return 'bg-sky-500/10 text-sky-300';
  if (status === 'paused') return 'bg-rose-500/10 text-rose-300';
  return 'bg-slate-800 text-slate-300';
}

export default async function AdminServicesPage() {
  await requireAdminUser();
  const services = await getServicesForAdmin();

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Service Moderation</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Control the Studio catalogue</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Use status changes to move services between draft, sandbox, testnet, live, and paused. This is the simplest operator lever we have today for shaping what agents can discover and call.
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <article key={service.id} className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">{service.name}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusTone(service.status)}`}>
                    {service.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{service.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Provider: {service.provider.email}</span>
                  <span>Slug: {service.studioSlug}</span>
                  <span>{service._count.calls} calls</span>
                  <span>{service._count.reviews} reviews</span>
                </div>
              </div>

              <form action={updateServiceStatus} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="serviceId" value={service.id} />
                <select
                  name="status"
                  defaultValue={service.status}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {['draft', 'sandbox', 'testnet', 'live', 'paused'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
                >
                  Save status
                </button>
              </form>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pricing</p>
                <p className="mt-2 text-sm text-white">
                  {(service.pricingConfig as { amount?: string; currency?: string } | null)?.amount ?? '0.01'} {(service.pricingConfig as { amount?: string; currency?: string } | null)?.currency ?? 'USDC'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Provider balances</p>
                <p className="mt-2 text-sm text-white">Testnet: {String(service.provider.testnetBalance)}</p>
                <p className="text-sm text-white">Live: {String(service.provider.liveBalance)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Payments</p>
                <p className="mt-2 text-sm text-white">{service.supportedPayments.join(', ')}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
