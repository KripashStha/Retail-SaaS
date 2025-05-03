// This is a server component for handling auth redirects
import { getServerSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function SignupLayout({ children }) {
  // Check if user is already authenticated
  const session = await getServerSession();

  // If user is logged in, redirect to admin dashboard
  if (session) {
    redirect("/admin/dashboard");
  }

  // Otherwise, render the signup page
  return <>{children}</>;
}
