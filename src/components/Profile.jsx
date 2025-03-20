"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/dbConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, LogOut, SunMediumIcon, MoonStarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function Profile() {
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
        // User is signed out, redirect to login
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="w-full justify-start mt-4">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarImage />
              <AvatarFallback className="bg-pink-500 text-white">
                {user
                  ? `${user.userName.split(" ")[0]?.charAt(0)}${
                      user.userName.split(" ")[1]?.charAt(0)
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
                  ? `${user.userName.split(" ")[0]?.charAt(0)}${
                      user.userName.split(" ")[1]?.charAt(0)
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
            <Button variant="ghost" className="justify-start">
              <SunMediumIcon className="h-5 w-5 mr-2"/> Toggle theme
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start text-red-500"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2"/> 
              {isLoading ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default Profile;