// Utility functions for handling authentication state

import { getAuth } from "firebase/auth";

/**
 * Refresh the authentication tokens and session
 * @returns {Promise<Object>} Result of the session refresh
 */
export const refreshAuthSession = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("No authenticated user found");
    }
    
    // Force token refresh to get updated claims
    const newIdToken = await user.getIdToken(true);
    
    // Refresh the session with the new token
    const refreshResponse = await fetch("/api/auth/session/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: newIdToken }),
      credentials: 'include' // Important to include cookies
    });
    
    if (!refreshResponse.ok) {
      throw new Error(`Session refresh failed with status: ${refreshResponse.status}`);
    }
    
    return await refreshResponse.json();
  } catch (error) {
    console.error("Failed to refresh session:", error);
    throw error;
  }
};

/**
 * Get the user's role from cookies
 * @returns {string|null} User role or null if not found
 */
export const getUserRoleFromCookie = () => {
  // Try to get from cookies
  const cookies = document.cookie.split(';');
  let userRole = null;
  
  // Check for either the httpOnly or client-accessible role cookie
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'user_role' || name === 'client_role') {
      userRole = value;
      break;
    }
  }
  
  return userRole;
};

/**
 * Navigate to the appropriate dashboard based on role
 * @param {string} role User role
 * @param {boolean} hardRedirect Whether to use window.location (true) or router.push (false)
 */
export const navigateByRole = (role, hardRedirect = false) => {
  const rolePaths = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    cashier: '/cashier/dashboard',
  };
  
  const targetPath = rolePaths[role] || '/business-setup';
  
  if (hardRedirect) {
    window.location.replace(targetPath);
  } else {
    // This would use router.push in components that have access to useRouter
    return targetPath;
  }
};
