"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/dbConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, SunMediumIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function Profile() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(userData);
          }
        } catch (error) {
          console.error("Error getting user document:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load user profile",
          });
        }
      } else {
        // User is signed out
        // No auto-redirection here - we'll handle it explicitly in handleSignOut
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // First, sign out from Firebase client-side
      await signOut(auth);

      // Then call our server API to clear the session cookie
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to logout on server");
      }

      // Clear any local storage items if needed
      localStorage.removeItem("user");

      // Add a delay to ensure cookies are properly processed
      setTimeout(() => {
        // Use window.location for a full page refresh to clear all state
        window.location.href = "/login";
      }, 100);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
      setIsLoading(false);
    }
  };

  // Rest of component remains the same
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="w-full justify-start mt-2 mb-2">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarImage />
              <AvatarFallback className="bg-pink-500 text-white">
                {user
                  ? `${user.userName?.split(" ")[0]?.charAt(0) || ""}${
                      user.userName?.split(" ")[1]?.charAt(0) || ""
                    }`
                  : ""}
              </AvatarFallback>
            </Avatar>
            <span>{user.userName}</span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-62">
          <div className="flex items-center space-x-2 mb-4">
            <Avatar className="h-9 w-9">
              <AvatarImage />
              <AvatarFallback className="bg-pink-500 text-white">
                {user
                  ? `${user.userName?.split(" ")[0]?.charAt(0) || ""}${
                      user.userName?.split(" ")[1]?.charAt(0) || ""
                    }`
                  : ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="block text-sm font-semibold">
                {user?.userName}
              </span>
              <span className="block text-xs text-gray-500">{user?.email}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={toggleTheme}
            >
              <SunMediumIcon className="h-5 w-5 mr-2" /> Toggle theme
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-red-500"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoading ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default Profile;
