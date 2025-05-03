// API route to create a session cookie from Firebase auth token
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/server-auth';

// Initialize Firebase Admin
const adminAuth = getAuth(getFirebaseAdminApp());

// Max age for the session cookie in seconds (14 days)
const SESSION_EXPIRES_IN = 60 * 60 * 24 * 14;

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }
    
    // Verify the ID token and create a session cookie
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN * 1000, // Convert to milliseconds
    });
    
    // Set the session cookie in the response
    const cookieStore = await cookies();
    
    // Get the protocol and host from the request
    const url = request.url || '';
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax', // Use 'none' if your frontend and API are on different domains
      // Don't set domain to let the browser set it automatically based on the current domain
    });
    
    console.log('Cookie set successfully in', isProduction ? 'production' : 'development');
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating session:', error.message);
    return NextResponse.json(
      { error: 'Failed to create session: ' + error.message },
      { status: 401 }
    );
  }
}