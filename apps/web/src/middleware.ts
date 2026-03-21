import { type NextRequest, NextResponse } from 'next/server';

// Rate limiting via cache is handled inside API route handlers (not Edge middleware)
// to avoid Edge runtime constraints. This middleware handles:
// 1. Public route pass-through
// 2. Dashboard auth redirect

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dashboard routes require auth — redirect to login if no session cookie
  if (pathname.startsWith('/dashboard')) {
    const hasSession =
      req.cookies.has('sb-access-token') ||
      req.cookies.has('supabase-auth-token') ||
      req.cookies.getAll().some((c) => c.name.startsWith('sb-'));

    if (!hasSession) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
