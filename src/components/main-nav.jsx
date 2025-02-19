import Link from "next/link";

import { cn } from "@/lib/utils";

export function MainNav({ className, ...props }) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Overview
      </Link>
      <Link
        href="/inventory"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Inventory
      </Link>
      <Link
        href="/pos"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Point of Sale
      </Link>
      <Link
        href="/alerts"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Alerts
      </Link>
      <Link
        href="/upload"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        CSV Upload
      </Link>
    </nav>
  );
}
