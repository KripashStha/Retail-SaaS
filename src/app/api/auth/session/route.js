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
    const { idToken } = await request.json();
    
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
    
    // Fetch user's role from Firestore using admin SDK
    const userDoc = await adminDb.collection("Users").doc(uid).get();
    
    if (!userDoc.exists) {
      console.error('User document does not exist');
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const userRole = userData.role || 'cashier'; // Default to 'user' if role is not defined
    
    // Set the session cookie in the response
    const cookieStore = cookies();
    
    // Get the protocol and host from the request
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax',
    });
    
    // Set the user role cookie
    cookieStore.set('user_role', userRole, {
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax',
    });
    
    console.log('Cookies set successfully in', isProduction ? 'production' : 'development');
    
    return NextResponse.json(
      { success: true, role: userRole },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session: ' + (error.message || 'Unknown error') },
      { status: 401 }
    );
  }
}