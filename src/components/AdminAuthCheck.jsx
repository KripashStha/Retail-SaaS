"use client";

import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { refreshAuthSession } from "@/utils/auth-utils";

export default function AdminAuthCheck({ children }) {
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status and refresh if needed
    const auth = getAuth();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Try to refresh the session to ensure valid cookies
          await refreshAuthSession();
        } catch (error) {
          console.error("Failed to refresh auth session:", error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description:
              "There was a problem with your session. Please try logging in again.",
          });

          // Redirect to login if refresh fails
          window.location.href = "/login";
        }
      } else {
        // No user is logged in
        console.log("No authenticated user found, redirecting to login");
        window.location.href = "/login";
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, [toast]);

  return children;
}
