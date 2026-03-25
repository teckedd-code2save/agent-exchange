import { createSupabaseServerClient } from '@/lib/supabase';

export function isAuthBypassEnabled() {
  return process.env['AUTH_BYPASS'] === 'true';
}

export type CurrentActor = {
  userId: string | null;
  email: string | null;
  isBypass: boolean;
};

export async function getCurrentActor(): Promise<CurrentActor> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    return {
      userId: user.id,
      email: user.email ?? null,
      isBypass: false,
    };
  }

  if (isAuthBypassEnabled()) {
    return {
      userId: 'dev-bypass-user',
      email: 'dev@localhost',
      isBypass: true,
    };
  }

  return {
    userId: null,
    email: null,
    isBypass: false,
  };
}
