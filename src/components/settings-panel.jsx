"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/dbConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { AlertCircle, Loader2, Save, Store, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrency } from "@/contexts/currency-context";

export function SettingsPanel() {
  // Store settings
  const [storeName, setStoreName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState(10);

  // Account settings
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State management
  const [businessId, setBusinessId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { setCurrency: setGlobalCurrency, CURRENCY_CONFIG } = useCurrency();

  // Fetch business and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (auth.currentUser) {
          setEmail(auth.currentUser.email);

          // Check for pending email in localStorage
          const storedPendingEmail = localStorage.getItem("pendingEmail");
          if (storedPendingEmail) {
            setPendingEmail(storedPendingEmail);
          }

          const userDoc = await getDocs(
            query(
              collection(db, "Users"),
              where("email", "==", auth.currentUser.email)
            )
          );

          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            const businessId = userData.businessId;
            setBusinessId(businessId);
            setUserId(userDoc.docs[0].id);

            // Fetch business details
            const businessDoc = await getDoc(doc(db, "businesses", businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              setStoreName(businessData.name || "");
              setCurrency(businessData.currency || "USD");
              setTaxRate(businessData.taxRate || 0.1);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load settings. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Listen for auth state changes to detect when email gets verified
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && pendingEmail) {
        // Check if the email has been updated to the pending email
        if (user.email === pendingEmail) {
          try {
            // Update email in Firestore Users collection
            const userDocs = await getDocs(
              query(collection(db, "Users"), where("email", "!=", pendingEmail))
            );

            // Find the user document that belongs to this user
            for (const doc of userDocs.docs) {
              const userData = doc.data();
              if (userData.businessId === businessId) {
                // Update the email in Firestore
                await updateDoc(doc.ref, {
                  email: pendingEmail,
                });

                // Clear the pending email
                localStorage.removeItem("pendingEmail");
                setPendingEmail("");

                toast({
                  title: "Email Updated",
                  description:
                    "Your email has been successfully updated to " +
                    pendingEmail,
                });

                break;
              }
            }
          } catch (error) {
            console.error(
              "Error updating Firestore after email verification:",
              error
            );
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "Your email was updated in authentication but we couldn't update it in the database. Please contact support.",
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [pendingEmail, businessId]);

  // Save store settings
  const saveStoreSettings = async () => {
    try {
      setSavingStore(true);
      setError(null);

      if (!businessId) {
        throw new Error("Business ID not found");
      }

      // Validate inputs
      if (!storeName.trim()) {
        throw new Error("Store name cannot be empty");
      }

      const taxRateNum = parseFloat(taxRate);
      if (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100) {
        throw new Error("Tax rate must be a number between 0 and 100");
      }

      // Update business document
      await updateDoc(doc(db, "businesses", businessId), {
        name: storeName.trim(),
        currency,
        taxRate: taxRateNum,
        updatedAt: new Date().toISOString(),
      });

      // Update global currency context
      setGlobalCurrency(currency);

      // Store in localStorage as well for persistence
      localStorage.setItem("preferredCurrency", currency);

      toast({
        title: "Success",
        description:
          "Store settings updated successfully. Currency has been changed to " +
          currency,
      });
    } catch (error) {
      console.error("Error saving store settings:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingStore(false);
    }
  };

  // Save account settings
  const saveAccountSettings = async () => {
    try {
      setSavingAccount(true);
      setError(null);

      // Validate inputs for email change
      if (email !== auth.currentUser.email && !currentPassword) {
        throw new Error("Current password is required to change email");
      }

      // Validate inputs for password change
      if (newPassword) {
        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters");
        }

        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match");
        }

        if (!currentPassword) {
          throw new Error("Current password is required to set a new password");
        }
      }

      // Re-authenticate user if changing email or password
      if (
        currentPassword &&
        (email !== auth.currentUser.email || newPassword)
      ) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Update email if changed
      if (email !== auth.currentUser.email) {
        try {
          // Store the original email for later reference
          const originalEmail = auth.currentUser.email;
          localStorage.setItem("originalEmail", originalEmail);
          localStorage.setItem("pendingEmail", email);
          setPendingEmail(email);

          // Use verifyBeforeUpdateEmail
          await verifyBeforeUpdateEmail(auth.currentUser, email);

          toast({
            title: "Verification Required",
            description:
              "A verification email has been sent to " +
              email +
              ". Please verify your email by clicking the link in the email before the change takes effect.",
          });

          // Clear password fields
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setSavingAccount(false);
          return;
        } catch (error) {
          console.error("Error updating email:", error);

          if (error.code === "auth/requires-recent-login") {
            throw new Error(
              "For security reasons, please log out and log back in before changing your email."
            );
          } else if (error.code === "auth/email-already-in-use") {
            throw new Error("This email is already in use by another account.");
          } else {
            throw error;
          }
        }
      }

      // Update password if provided
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);

        toast({
          title: "Success",
          description: "Password updated successfully",
        });
      }

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Only show success toast if there were changes
      if (!newPassword && email === auth.currentUser.email) {
        toast({
          title: "No Changes",
          description: "No account settings were changed",
        });
      }
    } catch (error) {
      console.error("Error saving account settings:", error);

      let errorMessage = error.message;
      if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect current password";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Please log out and log back in before changing your email or password";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use by another account";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "The email address is not valid";
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingAccount(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your store and account settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="store">
          <TabsList className="mb-4">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store Settings
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account Settings
            </TabsTrigger>
          </TabsList>

          {/* Store Settings Tab */}
          <TabsContent value="store">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Enter your store name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CURRENCY_CONFIG).map((currCode) => (
                      <SelectItem key={currCode} value={currCode}>
                        {currCode} ({CURRENCY_CONFIG[currCode].symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0.1 (10%)"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the tax percentage (e.g., 10 for 10%).
                </p>
              </div>

              <Button
                onClick={saveStoreSettings}
                disabled={savingStore}
                className="flex items-center gap-2"
              >
                {savingStore && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Save Store Settings
              </Button>
            </div>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {pendingEmail && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Email change to {pendingEmail} pending verification. Please
                  check your inbox and click the verification link.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={!!pendingEmail}
                />
                {pendingEmail && (
                  <p className="text-sm text-muted-foreground">
                    You cannot change your email while a verification is
                    pending.
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Change Password</h3>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Button
                onClick={saveAccountSettings}
                disabled={savingAccount || !!pendingEmail}
                className="flex items-center gap-2"
              >
                {savingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Save Account Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
