import { createSupabaseServerClient } from './supabase';
import { problemDetails } from '@/types/index';

export async function requireAuth(): Promise<{ userId: string } | Response> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return problemDetails(401, 'Unauthorized', 'Valid Supabase session required');
  }

  return { userId: user.id };
}

export function requireAdminKey(req: Request): Response | null {
  const key = req.headers.get('x-admin-key');
  const expected = process.env['ADMIN_API_KEY'];
  if (!expected || key !== expected) {
    return problemDetails(403, 'Forbidden', 'Valid X-Admin-Key header required');
  }
  return null;
}

export function requireCronSecret(req: Request): Response | null {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env['CRON_SECRET']}`;
  if (authHeader !== expected) {
    return problemDetails(401, 'Unauthorized', 'Valid cron secret required');
  }
  return null;
}
