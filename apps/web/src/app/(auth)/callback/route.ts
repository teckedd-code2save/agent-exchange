import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabaseBrowserKey } from '@/lib/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      getSupabaseBrowserKey(),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
              cookieStore.set({ name, value, ...options });
            });
          },
        },
      },
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  const next = searchParams.get('next') ?? '/dashboard';
  // Only allow relative paths to prevent open redirects
  const safeNext = next.startsWith('/') ? next : '/dashboard';
  redirect(safeNext);
}
