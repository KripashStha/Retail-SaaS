"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-auth";
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Benefits from '../components/Benefits';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import CTA from '@/components/CTA';


export default async function HomePage() {
  // Check if user is already authenticated on the server
  const session = await getServerSession();
  
  // If user is logged in, redirect to admin dashboard
  if (session) {
    redirect("/admin/dashboard");
  }
  
  return (
    <div className="min-h-screen dark:bg-gray-900">
      <Header />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

