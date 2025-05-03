// API route to handle server-side session cookie removal
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Get the cookies instance - make sure to await it
    const cookieStore = await cookies();
    
    // Set a special "logging-out" cookie that will prevent redirect loops
    // This will be detected by the login layout
    cookieStore.set('logging-out', 'true', { 
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 // Valid for 60 seconds - enough time for the redirect to complete
    });
    
    // Clear the session cookie with proper expiration settings to ensure deletion
    cookieStore.set('session', '', { 
      expires: new Date(0), 
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    });
    
    // Return success response with explicit no-cache headers
    return NextResponse.json(
      { success: true },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly' // Extra redundancy
        }
      }
    );
  } catch (error) {
    console.error('Failed to clear session cookie:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}