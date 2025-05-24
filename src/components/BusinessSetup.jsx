"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/dbConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";

export default function BusinessSetup() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Create business document with server timestamp
      const businessRef = await addDoc(collection(db, "businesses"), {
        name: company.trim(),
        admin: user.uid,
        createdAt: serverTimestamp(),
      });

      // Create user document with business reference
      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        userName: user.displayName,
        role: "admin",
        businessId: businessRef.id,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: "Business account created successfully",
      });
      // Set user_role cookie manually to help with middleware navigation
      document.cookie = `user_role=admin; path=/; max-age=${60 * 60 * 24 * 14}`; // 14 days

      // Use both router.push and window.location for more reliable redirection
      console.log("Redirecting to admin dashboard...");
      // Force token refresh to get updated claims
      const newIdToken = await user.getIdToken(true);

      // Refresh the session with the new token that includes role info
      try {
        const refreshResponse = await fetch("/api/auth/session/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: newIdToken }),
          credentials: "include", // Important to include cookies
        });

        if (!refreshResponse.ok) {
          throw new Error(
            `Session refresh failed with status: ${refreshResponse.status}`
          );
        }

        const refreshData = await refreshResponse.json();
        console.log("Session refresh successful:", refreshData);
      } catch (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        // Continue anyway, the cookie we set manually should work
      }

      // Set both cookies to ensure they're available in the client
      document.cookie = `user_role=admin; path=/; max-age=${60 * 60 * 24 * 14}`; // 14 days

      // Small delay to ensure toast is visible and cookies are set
      toast({
        title: "Setting up your dashboard",
        description: "Redirecting you to your admin dashboard...",
        duration: 2000,
      });

      setTimeout(() => {
        // Force a hard reload to ensure all cookies are applied
        window.location.replace("/admin/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error creating business:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create business account",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-indigo-100 to-purple-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <Package className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <CardTitle className="text-center text-2xl pb-5">
            Welcome to Easy Inventory
          </CardTitle>
          <CardTitle className="text-center text-muted-foreground text-md">
            Complete Your Business Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company">Business Name</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                placeholder="Enter your business name"
                className="mt-1 mb-6"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading || !company.trim()}
            >
              {loading ? "Creating..." : "Create Business Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
