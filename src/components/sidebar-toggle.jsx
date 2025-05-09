"use client";

import { Menu } from "lucide-react";

export default function SidebarToggle() {
  const handleToggle = () => {
    document.dispatchEvent(new CustomEvent("toggleSidebar"));
  };
  return (
    <div className="md:hidden pl-4 pr-2 py-4">
      <button
        className="p-2 rounded bg-white dark:bg-gray-900 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={handleToggle}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6 text-indigo-600" />
      </button>
    </div>
  );
}
