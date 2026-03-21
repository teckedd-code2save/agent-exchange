import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-1">
        <div className="text-sm font-semibold text-gray-400 mb-4 px-2">Agent Exchange</div>
        <NavLink href="/dashboard">Overview</NavLink>
        <NavLink href="/dashboard/services">Services</NavLink>
        <NavLink href="/dashboard/analytics">Analytics</NavLink>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
