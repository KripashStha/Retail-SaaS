"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "@/firebase/dbConfig";
import { Eye, EyeOff, Package } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import GoogleOauth from "@/components/GoogleOauth";
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;

      if(!user.emailVerified){
        alert("Please verify your email to proceed.");
        // Redirect to a "Verify Email" page
        return;
  
      }

      console.log("User logged in successfully");
    } catch (error) {
      console.log("Login failed", error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-indigo-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background package logos */}
      <div className="absolute inset-0 z-0 opacity-10">
        <Package className="absolute top-1/4 left-1/4 h-16 w-16 text-indigo-600 dark:text-indigo-400 transform -rotate-12" />
        <Package className="absolute top-3/4 left-1/3 h-24 w-24 text-purple-600 dark:text-purple-400 transform rotate-45" />
        <Package className="absolute top-1/2 right-1/4 h-20 w-20 text-indigo-600 dark:text-indigo-400 transform rotate-12" />
      </div>
      <Card className="w-full max-w-md shadow-2xl relative z-10">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center">
            <Package className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800 dark:text-white">Sign in to your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email"  onChange={(e) => setEmail(e.target.value)}
              type="email" placeholder="john@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Remember me
              </Label>
            </div>
            <Link href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Forgot password?
            </Link>
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
            onClick={handleLogin}>Sign In</Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>
          < GoogleOauth />
        </CardFooter>
      </Card>
      <p className="absolute bottom-40 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
          Sign up
        </Link>
      </p>
    </div>
  )
}

