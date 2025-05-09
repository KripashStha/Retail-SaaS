import { NextResponse } from 'next/server';

// Define role-based redirect paths
const ROLE_REDIRECT_PATHS = {
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  cashier: '/cashier/dashboard',
};

// Define which paths are accessible to which roles
const PROTECTED_ROUTES = {
  '/admin': ['admin'],
  '/manager': ['admin', 'manager'],
  '/cashier': ['admin', 'manager', 'cashier'],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes and API routes to pass through
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') || 
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/invite/accept')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  
  // If no session cookie, redirect to login
  if (!sessionCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check for the "role" cookie that we'll set on login
  const roleCookie = request.cookies.get('user_role')?.value;
  
  if (!roleCookie) {
    // If no role cookie but has session, redirect to login to refresh role
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Handle redirects for root role paths (e.g., /admin, /manager, /cashier)
  if (pathname === '/admin' || pathname === '/manager' || pathname === '/cashier') {
    const redirectPath = ROLE_REDIRECT_PATHS[roleCookie];
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Check if route is protected
  for (const [protectedPath, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(protectedPath) && !allowedRoles.includes(roleCookie)) {
      // Redirect to the appropriate dashboard based on role
      const redirectPath = ROLE_REDIRECT_PATHS[roleCookie] || '/login';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // User has access to the requested route
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (for authentication callbacks)
     * - _next/static (for static files)
     * - _next/image (for image optimization files)
     * - favicon.ico (for favicon)
     * - public (for public files like images)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg).*)',
  ],
};