import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if it hasn't been initialized already
export const getFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check for environment variables and provide more detailed error logging
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Log environment variable availability (without exposing sensitive values)
  console.log('Firebase Admin Config Check:', {
    projectId: projectId ? '✓ Available' : '✗ Missing',
    clientEmail: clientEmail ? '✓ Available' : '✗ Missing',
    privateKey: privateKey ? '✓ Available' : '✗ Missing'
  });

  const FIREBASE_ADMIN_CONFIG = {
    projectId,
    clientEmail,
    privateKey,
  };

  try {
    // Check if any of the required config values are missing
    if (!FIREBASE_ADMIN_CONFIG.projectId || 
        !FIREBASE_ADMIN_CONFIG.clientEmail || 
        !FIREBASE_ADMIN_CONFIG.privateKey) {
      console.error('Missing Firebase Admin configuration. Check your environment variables.');
      throw new Error('Missing Firebase Admin configuration');
    }
    
    return initializeApp({
      credential: cert(FIREBASE_ADMIN_CONFIG),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Add more detailed error information without exposing sensitive data
    if (error.message?.includes('private_key')) {
      console.error('Firebase private key appears to be invalid. Check your FIREBASE_ADMIN_PRIVATE_KEY format.');
    }
    throw error;
  }
};

// Initialize the app and services
const app = getFirebaseAdminApp();
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    // Verify the session cookie and get the user
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

// Helper function to serialize timestamps and other complex objects
function serializeData(data) {
  if (!data) return null;
  
  const serialized = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Handle Firestore Timestamps
    if (value && typeof value === 'object' && value._seconds !== undefined && value._nanoseconds !== undefined) {
      // Convert to ISO string format
      serialized[key] = new Date(value._seconds * 1000).toISOString();
    } 
    // Handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      serialized[key] = serializeData(value);
    } 
    // Handle arrays
    else if (Array.isArray(value)) {
      serialized[key] = value.map(item => 
        typeof item === 'object' && item !== null ? serializeData(item) : item
      );
    } 
    // Handle simple values
    else {
      serialized[key] = value;
    }
  });
  
  return serialized;
}

export async function getBusinessData(userId) {
  if (!userId) return null;
  
  try {
    const userRef = adminDb.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    const businessRef = adminDb.collection('businesses').doc(userData.businessId);
    const businessDoc = await businessRef.get();
    
    if (!businessDoc.exists) {
      return null;
    }
    
    // Serialize the business data before returning
    return serializeData(businessDoc.data());
  } catch (error) {
    console.error('Error fetching business data:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session.uid;
}

// New functions for role-based authentication

export async function getUserRole(userId) {
  if (!userId) return null;
  
  try {
    const userRef = adminDb.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function requireRole(allowedRoles) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  const userId = session.uid;
  const userRole = await getUserRole(userId);
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      redirect('/admin/dashboard');
    } else if (userRole === 'manager') {
      redirect('/manager/dashboard');
    } else if (userRole === 'cashier') {
      redirect('/cashier/summary');
    } else {
      // If no valid role, redirect to login
      redirect('/login');
    }
  }
  
  return { userId, userRole };
}

// Helper function to get the dashboard path for a user's role
export function getRoleDashboard(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'cashier':
      return '/cashier/summary';
    default:
      return '/login';
  }
}