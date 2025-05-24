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
    pathname.startsWith('/invite/accept') ||
    pathname.startsWith('/business-setup')
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
  
  // Check for role cookies - try both the httpOnly and client-side versions
  const roleCookie = request.cookies.get('user_role')?.value || request.cookies.get('client_role')?.value;
  
  // Log current state for debugging
  console.log(`Middleware path: ${pathname}, roleCookie: ${roleCookie || 'none'}`);
  
  // Special case for business-setup path
  if (pathname.startsWith('/business-setup')) {
    if (roleCookie) {
      // If user already has a role, redirect them to their dashboard
      const redirectPath = ROLE_REDIRECT_PATHS[roleCookie] || '/admin/dashboard';
      console.log(`User has role ${roleCookie}, redirecting from business-setup to ${redirectPath}`);
      const redirectUrl = new URL(redirectPath, request.url);
      return NextResponse.redirect(redirectUrl);
    }
    // If no role cookie, allow access to business setup
    console.log('No role found, allowing access to business-setup');
    return NextResponse.next();
  }
  
  if (!roleCookie) {
    // If no role cookie but has session, redirect to business setup if path requires role
    if (pathname !== '/business-setup') {
      console.log('No role found, redirecting to business-setup');
      return NextResponse.redirect(new URL('/business-setup', request.url));
    }
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