"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/dbConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
        description: "Business account created successfully"
      });

      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Error creating business:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create business account"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Business Setup</CardTitle>
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
                className="mt-1"
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
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