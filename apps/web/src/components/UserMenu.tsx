'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase.auth]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) return <div className="h-8 bg-gray-800 rounded animate-pulse" />;

  if (!user) {
    return (
      <a href="/login" className="block px-3 py-2 rounded-md text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
        Sign in →
      </a>
    );
  }

  const initials = (user.email ?? 'U').slice(0, 2).toUpperCase();
  const emailShort = user.email ?? '';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="text-xs text-gray-400 truncate flex-1">{emailShort}</span>
      </div>
      <button
        onClick={signOut}
        className="w-full text-left px-3 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
