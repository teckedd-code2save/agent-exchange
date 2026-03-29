import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase';

export type AuthenticatedProvider = {
  userId: string;
  email: string;
};

export async function authenticateProvider(req: NextRequest): Promise<AuthenticatedProvider | null> {
  if (process.env['AUTH_BYPASS'] === 'true') {
    return { userId: 'dev-bypass-user', email: 'dev@localhost' };
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']!,
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      return { userId: user.id, email: user.email ?? '' };
    }
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { userId: user.id, email: user.email ?? '' };
}
