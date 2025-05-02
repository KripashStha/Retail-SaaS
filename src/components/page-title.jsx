"use client";

import { usePathname } from "next/navigation";

export function PageTitle({ businessName }) {
  const pathname = usePathname();
  const currentView = pathname.split("/").pop();

  return (
    <h2 className="text-2xl pl-14 sm:pl-0 sm:text-3xl font-bold tracking-tight break-words">
      {businessName?.name || ""}{" "}
      {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
    </h2>
  );
}
