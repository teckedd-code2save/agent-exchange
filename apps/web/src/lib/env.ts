export function getAppUrl() {
  const explicitUrl = process.env['NEXT_PUBLIC_APP_URL'];
  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, '');
  }

  const vercelUrl =
    process.env['VERCEL_PROJECT_PRODUCTION_URL'] ?? process.env['VERCEL_URL'];
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
}

export function getSupabaseBrowserKey() {
  const key =
    process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] ??
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!key) {
    throw new Error(
      'Missing Supabase browser key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return key;
}
