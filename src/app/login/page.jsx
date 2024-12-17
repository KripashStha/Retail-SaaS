"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth } from "@/firebase/dbConfig";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in successfully");
    } catch (error) {
      console.log("Login failed", error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h3 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Login
        </h3>

        <div className="mb-4">
          <label htmlFor="Email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500
             focus:border-green-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="Password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500
             focus:border-green-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
