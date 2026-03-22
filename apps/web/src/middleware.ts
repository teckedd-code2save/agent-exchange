import { type NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dashboard routes require auth — redirect to login if no session cookie
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    // Allow bypass in local dev via AUTH_BYPASS env
    if (process.env['AUTH_BYPASS'] === 'true') {
      return NextResponse.next();
    }

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
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
