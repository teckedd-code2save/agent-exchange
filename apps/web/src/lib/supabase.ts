import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseBrowserKey } from '@/lib/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    getSupabaseBrowserKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot always set cookies. Middleware/session refresh handles it.
          }
        },
      },
    },
  );
}
