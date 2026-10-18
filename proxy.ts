// import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/mfa-setup',
  '/mfa-verify',
  '/device-verify',
  '/forgot-password',
  '/setup-password',
  '/favicon.ico',
  '/public',
  '/kyc-submit',
];

// export default auth((req) => {
//   const { pathname } = req.nextUrl;
//   const isPublicRoute = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

//   // Check if user is authenticated
//   const isAuthenticated = !!req.auth;

//   // Allow public routes
//   if (isPublicRoute) {
//     // Redirect to dashboard if already logged in and trying to access login
//     if (pathname === '/login' && isAuthenticated) {
//       return NextResponse.redirect(new URL('/', req.url));
//     }
//     return NextResponse.next();
//   }

//   // Redirect to login if not authenticated
//   if (!isAuthenticated) {
//     const loginUrl = new URL('/login', req.url);
//     if (pathname !== '/') {
//       loginUrl.searchParams.set('from', pathname);
//     }
//     return NextResponse.redirect(loginUrl);
//   }

//   // Check for refresh token error
//   if (req.auth?.error === 'RefreshAccessTokenError') {
//     const loginUrl = new URL('/login', req.url);
//     loginUrl.searchParams.set('error', 'session_expired');
//     return NextResponse.redirect(loginUrl);
//   }

//   return NextResponse.next();
// });

export default async function proxt(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicRoute = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  let isAuthenticated = false; // Replace with actual authentication check

  const reqCookies = await cookies()

  const accessToken = reqCookies.get('accessToken');

  if (accessToken) {
    isAuthenticated = true;
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  } else {
    return NextResponse.next();
  }

}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)'],
};
