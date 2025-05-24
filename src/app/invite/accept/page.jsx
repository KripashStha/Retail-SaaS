"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Package, Eye, EyeOff } from "lucide-react";

function InviteAcceptContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  // Check if passwords match whenever either password field changes
  useEffect(() => {
    if (password !== "" || confirmPassword !== "") {
      setPasswordsMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

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
      }); // Get the ID token to create a session
      const idToken = await userCredential.user.getIdToken();

      // Create a session cookie
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken, role: invitation.role }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session");
      }

      // Redirect based on user role
      switch (invitation.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "manager":
          router.push("/manager/dashboard");
          break;
        case "cashier":
          router.push("/cashier/dashboard");
          break;
        default:
          router.push("/login");
      }
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
      <Card className="w-full max-w-md shadow-2xl ">
        <CardHeader>
          <div className="flex items-center justify-center">
            <Package className="h-12 w-12 text-indigo-600 " />
          </div>

          <CardTitle className="text-center text-2xl py-3 font-bold">
            Accept Invitation
          </CardTitle>
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
            </div>{" "}
            <div>
              <Label htmlFor="password">Set Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={
                    !passwordsMatch && confirmPassword !== ""
                      ? "border-red-500 pr-10"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={
                    !passwordsMatch && confirmPassword !== ""
                      ? "border-red-500 pr-10"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {!passwordsMatch && confirmPassword !== "" && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={!passwordsMatch || password.length < 8}
            >
              Accept Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvite() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
