// TODO: Phase 2 — Admin service approval
// Stub: returns 501 Not Implemented
import { type NextRequest } from 'next/server';
import { requireAdminKey } from '@/lib/auth';
import { problemDetails } from '@/types/index';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const denied = requireAdminKey(req);
  if (denied) return denied;

  return problemDetails(
    501,
    'Not Implemented',
    `Admin approval for "${params.slug}" is deferred to Phase 2. Use the Supabase dashboard to manually set status=active.`,
  );
}
