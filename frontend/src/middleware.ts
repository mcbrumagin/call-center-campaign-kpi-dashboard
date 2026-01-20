import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

// Routes that require authentication
const protectedRoutes = ['/admin'];
// Routes that should redirect to admin if already logged in
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.includes(path);

  const session = request.cookies.get('session')?.value;

  let isValidSession = false;
  if (session) {
    try {
      await jwtVerify(session, encodedKey, { algorithms: ['HS256'] });
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // Redirect to login if accessing protected route without valid session
  if (isProtectedRoute && !isValidSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to admin if accessing auth routes with valid session
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
