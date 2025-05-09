"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  X,
  Receipt,
} from "lucide-react";
import Profile from "@/components/Profile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CashierSidebar({ businessName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const currentView = pathname.split("/").pop();

  // Listen for toggle events from the layout component
  useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen((prev) => !prev);
    };

    document.addEventListener("toggleSidebar", handleToggle);
    return () => document.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  return (
    <>
      {/* Sidebar overlay for mobile */}
      <div
        className={
          sidebarOpen
            ? "fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden block"
            : "hidden"
        }
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar */}{" "}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-64 max-w-full transform bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between transition-transform duration-200 ease-in-out overflow-hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex md:w-64`}
      >
        {" "}
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <Package className="h-6 w-6 text-indigo-600" />
          <span className="font-semibold text-xl text-indigo-600 dark:text-indigo-400 ">
            Easy Inventory
          </span>
          {/* Hamburger close button on mobile */}
          <button
            className="ml-auto md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>{" "}
        {/* Main Navigation */}
        <div className="px-2 md:px-3 py-4 flex-1 overflow-y-auto overflow-x-hidden">
          <nav className="space-y-6">
            {/* Dashboard Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 md:px-3 mb-2">
                Main
              </h3>
              <div className="space-y-1">
                <Link href="/cashier/dashboard" className="block">
                  <Button
                    variant={currentView === "dashboard" ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "dashboard" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Inventory Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 md:px-3 mb-2">
                Inventory
              </h3>
              <div className="space-y-1">
                <Link href="/cashier/inventory" className="block">
                  <Button
                    variant={currentView === "inventory" ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "inventory" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <Package className="h-5 w-5 mr-3" />
                    <span>Inventory</span>
                  </Button>
                </Link>
                <Link href="/cashier/pos" className="block">
                  <Button
                    variant={currentView === "pos" ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "pos" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <ShoppingCart className="h-5 w-5 mr-3" />
                    <span>Point of Sale</span>
                  </Button>
                </Link>
                <Link href="/cashier/sales-history" className="block">
                  <Button
                    variant={
                      currentView === "sales-history" ? "default" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "sales-history" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <Receipt className="h-5 w-5 mr-3" />
                    <span>Sales History</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              {" "}
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 md:px-3 mb-2">
                Settings
              </h3>
              <div className="space-y-1">
                <Link href="/cashier/settings" className="block">
                  <Button
                    variant={currentView === "settings" ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "settings" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    <span>Settings</span>
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
        </div>{" "}
        {/* Bottom Section */}
        <div className="w-full border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="px-2 md:px-3 py-4">
            <Profile />
          </div>
        </div>
      </div>
    </>
  );
}
