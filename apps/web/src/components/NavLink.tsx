'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm transition-all ${
        isActive
          ? 'bg-brand-500/15 text-brand-300 font-medium shadow-[inset_0_0_0_1px_rgba(0,82,255,0.2)]'
          : 'text-ink-secondary hover:bg-white/5 hover:text-ink-primary'
      }`}
    >
      {children}
    </Link>
  );
}
