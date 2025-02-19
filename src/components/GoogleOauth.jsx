"use client";

import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { db } from "@/firebase/dbConfig";
import { useToast } from "@/hooks/use-toast";

function GoogleOauth() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    // Configure auth provider
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "Users", user.uid));

      if (!userDoc.exists()) {
        router.push("/business-setup");
      } else {
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      let errorMessage = "Failed to sign in with Google";
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed before completing";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Sign-in popup was blocked by the browser. Please allow popups for this site.";
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex space-x-3 w-full">
      <Button 
        onClick={handleGoogleSignIn} 
        variant="outline" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : (
          <>
            <img src="/google.png" alt="Google logo" className="mr-2 h-4 w-4" />
            Sign in with Google
          </>
        )}
      </Button>
    </div>
  );
}

export default GoogleOauth;