import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase';
import { isAuthBypassEnabled } from '@/lib/auth';

export { isAuthBypassEnabled } from '@/lib/auth';

function parseAdminEmails() {
  return (process.env['ADMIN_EMAILS'] ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminUser() {
  if (isAuthBypassEnabled()) {
    return {
      user: {
        id: 'dev-admin',
        email: 'dev@localhost',
      },
      isOpenAdminMode: true,
    };
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const adminEmails = parseAdminEmails();
  const email = (user.email ?? '').toLowerCase();
  const isAdmin = adminEmails.length === 0 || adminEmails.includes(email);

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return {
    user,
    isOpenAdminMode: adminEmails.length === 0,
  };
}
