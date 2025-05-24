// API route to create a session cookie from Firebase auth token
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/server-auth';

// Initialize Firebase Admin
const adminApp = getFirebaseAdminApp();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

// Max age for the session cookie in seconds (14 days)
const SESSION_EXPIRES_IN = 60 * 60 * 24 * 14;

export async function POST(request) {
  try {
    // Parse the request body with error handling
    let idToken;
    try {
      const body = await request.json();
      idToken = body.idToken;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format', 
        details: parseError.message 
      }, { status: 400 });
    }
    
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }
    
    // Verify the ID token and create a session cookie
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN * 1000, // Convert to milliseconds
    });
      // Fetch user's role from Firestore using admin SDK (if it exists)
    let userRole = null;
    let userData = null;
    
    try {
      const userDoc = await adminDb.collection("Users").doc(uid).get();
      
      if (userDoc.exists) {
        userData = userDoc.data();
        userRole = userData.role || 'cashier'; // Default to 'cashier' if role is not defined
      } else {
        console.log('New user detected, no document exists yet');
        // For new users, we don't set a role yet - they need to complete setup first
      }
    } catch (userError) {
      console.warn('Error fetching user data:', userError);
      // Continue anyway - this could be a new user
    }    // Get the protocol and host from the request
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Cookie settings
    const cookieOptions = {
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax',
    };
    
    // Create response object first
    const response = NextResponse.json(
      { 
        success: true, 
        role: userRole, 
        isNewUser: !userRole,
        uid
      },
      { status: 200 }
    );
    
    // Set cookies on the response object
    response.cookies.set('session', sessionCookie, cookieOptions);
    
    // Set the user role cookie if we have one
    if (userRole) {
      // Set httpOnly cookie for server usage
      response.cookies.set('user_role', userRole, cookieOptions);
      
      // Also set a non-httpOnly version for client-side access
      response.cookies.set('client_role', userRole, {
        ...cookieOptions,
        httpOnly: false,
      });
    }
    
    console.log('Cookies set successfully in', isProduction ? 'production' : 'development', 'with role:', userRole);
      console.log('Cookies set successfully in', isProduction ? 'production' : 'development', 'with role:', userRole);
    
    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session: ' + (error.message || 'Unknown error') },
      { status: 401 }
    );
  }
}