"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/dbConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function AcceptInvite() {
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        if (!token) {
          setError("Invalid invitation link");
          return;
        }

        const invitationDoc = await getDoc(doc(db, "invitations", token));

        if (!invitationDoc.exists()) {
          setError("Invitation is no longer available");
          return;
        }

        const invitationData = invitationDoc.data();

        // Check if invitation has expired
        if (new Date(invitationData.expiresAt) < new Date()) {
          setError("Invitation has expired");
          return;
        }

        // Check if invitation has already been used
        if (invitationData.status === "accepted") {
          setError("Invitation has already been used");
          return;
        }

        setInvitation(invitationData);
      } catch (error) {
        console.error("Error verifying invitation:", error);
        setError("Error verifying invitation");
      } finally {
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    try {
      if (!invitation) {
        throw new Error("Invalid invitation");
      }

      // Create user account or sign in
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          invitation.email,
          password
        );
      } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          userCredential = await signInWithEmailAndPassword(
            auth,
            invitation.email,
            password
          );
        } else {
          throw error;
        }
      }

      // Create user document using Firebase Auth UID
      await setDoc(doc(db, "Users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        userName: name,
        email: invitation.email,
        role: invitation.role,
        businessId: invitation.businessId,
        status: "active",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });

      // Update invitation status
      await updateDoc(doc(db, "invitations", token), {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        acceptedByUid: userCredential.user.uid,
      });

      toast({
        title: "Success",
        description: "Invitation accepted successfully",
      });

      router.push("/admin");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to accept invitation",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                type="text"
                value={invitation?.role || ""}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="password">UserName</Label>
              <Input
                id="userName"
                type="userName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="password">Set Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full">
              Accept Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
