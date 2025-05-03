// This is a server component for handling auth redirects
import { getServerSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomeLayout({ children }) {
  // Simply render the landing page without any authentication checks
  // The authentication checks are already handled in the root page.js
  return <>{children}</>;
}
