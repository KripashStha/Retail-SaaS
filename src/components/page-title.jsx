"use client";

import { usePathname } from "next/navigation";

export function PageTitle({ businessName }) {
  const pathname = usePathname();
  const currentView = pathname.split("/").pop();

  return (
    <div className="py-4 md:px-8 md:pt-8 overflow-hidden">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight break-words pr-4">
        {businessName?.name || ""}
        {businessName?.name && <span className="md:inline"> </span>}
        {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
      </h2>
    </div>
  );
}
