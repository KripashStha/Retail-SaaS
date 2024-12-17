"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/dbConfig";
import { setDoc, doc } from "firebase/firestore";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log(user);
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
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSignUp} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Get started and grow your business.</h2>

        <div className="mb-4">
          <label htmlFor="Username" className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            onChange={(e) => setName(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500
             focus:border-green-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="Email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2
             focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="Password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-2
             focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-md
           hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default SignUp;
