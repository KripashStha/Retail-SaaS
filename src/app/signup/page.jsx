"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../../firebase/dbConfig";
import { setDoc, doc } from "firebase/firestore";
import { Eye, EyeOff, Package } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import GoogleOauth from "@/components/GoogleOauth";
import Link from 'next/link'

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        const user = auth.currentUser;
        console.log(user);

            // Send verification email
        await sendEmailVerification(user);
        console.log("Verification email sent.");

        if (user) {
          await setDoc(doc(db, "Users", user.uid), {
            email: user.email,
            userName: name,
            role: "cashier", // Default role is cashier
          });
        }
        console.log("User created successfully");
      } catch (err) {
        console.log(err.message);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {}
    if (!name) newErrors.name = 'Full name is required'
    if (!email) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const passwordStrength = (password) => {
    const strengthChecks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ]
    return strengthChecks.filter(Boolean).length
  }

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
            <Link href="/"><Package className="h-12 w-12 text-indigo-600 dark:text-indigo-400" /></Link> 
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-800 dark:text-white">Create your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input 
              id="full-name" 
              placeholder="John Doe"
              onChange={(e) => setName(e.target.value)}
              required />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="john@example.com" 
              onChange={(e) => setEmail(e.target.value)}
              required />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
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
          <div className="space-y-2">
            <Label>Password Strength</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 w-full rounded-full ${
                    passwordStrength(password) >= level
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSignUp}>Create Account</Button>
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
          <GoogleOauth />
          <p className="text-xs text-center w-full text-gray-600 dark:text-gray-400">
            By signing up, you agree to our{' '}
            <Link href="#" className="underline text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="#" className="underline text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
      <p className="absolute bottom-24 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}