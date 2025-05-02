"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTracking } from "@/components/product-management";
import { PointOfSale } from "@/components/point-of-sale";
import Employee from "@/components/Employee";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  Users,
  Menu,
  X,
  Receipt,
} from "lucide-react";
import { db, auth } from "@/firebase/dbConfig";
import { getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Profile from "@/components/Profile";
import { NotificationSystem } from "@/components/notification-system";
import { SettingsPanel } from "@/components/settings-panel";
import { NotificationBadge } from "@/components/notification-badge";
import { InventoryDashboard } from "@/components/inventory-dashboard";
import { SalesHistoryRefunds } from "@/components/sales-history-refunds";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const [businessName, setBusinessName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const currentView = pathname.split("/").pop(); // Get the last part of the URL

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const businessDoc = await getDoc(
              doc(db, "businesses", userData.businessId)
            );
            if (businessDoc.exists()) {
              setBusinessName(businessDoc.data());
            }
          }
        } catch (error) {
          console.error("Error fetching business info:", error);
        }
      } else {
        window.location.href = "/login";
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar overlay for mobile */}
      <Link
        className={
          sidebarOpen
            ? "fixed inset-0 z-40 bg-black bg-opacity-40 md:hidden block"
            : "hidden"
        }
        href="/dashboard"
        aria-label="Close sidebar overlay"
      />
      {/* Sidebar */}
      <div
        className={`fixed z-50 inset-y-0 left-0 w-64 transform bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex md:w-64`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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
        </div>
        {/* Main Navigation */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <nav className="space-y-6">
            {/* Dashboard Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 mb-2">
                Main
              </h3>
              <div className="space-y-1">
                <Link href="/admin/dashboard">
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
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 mb-2">
                Inventory
              </h3>
              <div className="space-y-1">
                <Link href="/admin/inventory">
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
                <Link href="/admin/pos">
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
                <Link href="/admin/sales-history">
                  <Button
                    variant={
                      currentView === "sales history" ? "default" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "sales history" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <Receipt className="h-5 w-5 mr-3" />
                    <span>Sales History</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Management Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 mb-2">
                Management
              </h3>
              <div className="space-y-1">
                <Link href="/admin/employee">
                  <Button
                    variant={currentView === "employee" ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "employee" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <Users className="h-5 w-5 mr-3" />
                    <span>Employees</span>
                  </Button>
                </Link>
                <Link href="/admin/notifications">
                  <Button
                    variant={
                      currentView === "notifications" ? "default" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-300",
                      currentView === "notifications" &&
                        "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white dark:bg-indigo-700 dark:text-white"
                    )}
                  >
                    <NotificationBadge />
                    <span>Notifications</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 mb-2">
                Settings
              </h3>
              <div className="space-y-1">
                <Link href="/admin/settings">
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
        </div>

        {/* Bottom Section */}
        <div className="w-full border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="px-3 py-4">
            <Profile />
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-w-0 flex flex-col relative">
        {/* Hamburger open button (top left) on mobile, inside main content */}
        {!sidebarOpen && (
          <button
            className="p-2 rounded md:hidden bg-white dark:bg-gray-900 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 absolute top-4 left-4"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 text-indigo-600" />
          </button>
        )}
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <h2 className="text-2xl pl-14 sm:pl-0 sm:text-3xl font-bold tracking-tight break-words ">
              {businessName.name}{" "}
              {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
