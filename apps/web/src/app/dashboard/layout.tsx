import Link from 'next/link';
import { NavLink } from '@/components/NavLink';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-1 shrink-0">
        <Link href="/" className="px-2 mb-5 block">
          <span className="text-base font-bold tracking-tight">Agent<span className="text-indigo-400">Exchange</span></span>
        </Link>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1">Operator</p>
        <NavLink href="/dashboard" exact>Overview</NavLink>
        <NavLink href="/dashboard/services">Services</NavLink>
        <NavLink href="/dashboard/transactions">Transactions</NavLink>
        <NavLink href="/dashboard/payouts">Payouts</NavLink>
        <NavLink href="/dashboard/analytics">Analytics</NavLink>
        <div className="mt-auto pt-4 border-t border-gray-800">
          <Link href="/marketplace" className="px-3 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors block">← Marketplace</Link>
          <Link href="/admin" className="px-3 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors block">Admin panel</Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
