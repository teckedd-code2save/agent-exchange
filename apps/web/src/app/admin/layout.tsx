import Link from 'next/link';
import { NavLink } from '@/components/NavLink';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-1 shrink-0">
        <Link href="/" className="px-2 mb-2 block">
          <span className="text-base font-bold tracking-tight">Agent<span className="text-indigo-400">Exchange</span></span>
        </Link>
        <div className="px-2 py-1 mb-3 bg-red-900/20 border border-red-800/40 rounded-md">
          <p className="text-xs text-red-400 font-semibold">Admin Panel</p>
        </div>
        <NavLink href="/admin" exact>Overview</NavLink>
        <NavLink href="/admin/services">Services</NavLink>
        <NavLink href="/admin/transactions">Transactions</NavLink>
        <div className="mt-auto pt-4 border-t border-gray-800">
          <Link href="/dashboard" className="px-3 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors block">← Dashboard</Link>
          <Link href="/marketplace" className="px-3 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors block">Marketplace</Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
