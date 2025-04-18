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
} from "lucide-react";
import { db, auth } from "@/firebase/dbConfig";
import { getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Profile from "@/components/Profile";
import { NotificationSystem } from "@/components/notification-system";
import { SettingsPanel } from "@/components/settings-panel";
import { NotificationBadge } from "@/components/notification-badge";
import { InventoryDashboard } from "@/components/inventory-dashboard";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [businessName, setBusinessName] = useState("");

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <InventoryDashboard />;
      case "inventory":
        return <InventoryTracking />;
      case "pos":
        return <PointOfSale />;
      case "alerts":
        return <AlertSystem />;
      case "employee":
        return <Employee />;
      case "notifications":
        return <NotificationSystem />;
      case "settings":
        return <SettingsPanel />;
      default:
        return null;
    }
  };

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
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 flex flex-col justify-between">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Package className="h-6 w-6 text-indigo-600" />
          <span className="font-semibold text-xl text-indigo-600">
            Easy Inventory
          </span>
        </div>

        {/* Main Navigation */}
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <nav className="space-y-6">
            {/* Dashboard Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-2">
                Main
              </h3>
              <div className="space-y-1">
                <Button
                  variant={currentView === "dashboard" ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600",
                    currentView === "dashboard" &&
                      "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white"
                  )}
                  onClick={() => setCurrentView("dashboard")}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  <span>Dashboard</span>
                </Button>
              </div>
            </div>

            {/* Inventory Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-2">
                Inventory
              </h3>
              <div className="space-y-1">
                <Button
                  variant={currentView === "inventory" ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600",
                    currentView === "inventory" &&
                      "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white"
                  )}
                  onClick={() => setCurrentView("inventory")}
                >
                  <Package className="h-5 w-5 mr-3" />
                  <span>Inventory</span>
                </Button>
                <Button
                  variant={currentView === "pos" ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600",
                    currentView === "pos" &&
                      "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white"
                  )}
                  onClick={() => setCurrentView("pos")}
                >
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  <span>Point of Sale</span>
                </Button>
              </div>
            </div>

            {/* Management Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-2">
                Management
              </h3>
              <div className="space-y-1">
                <Button
                  variant={currentView === "employee" ? "default" : "ghost"}
                  // className={`w-full justify-start text-base ${
                  //   currentView === "employee"
                  //     ? "bg-indigo-600 text-white"
                  //     : "hover:bg-indigo-100 hover:text-indigo-600"
                  // }`}
                  className={cn(
                    "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600",
                    currentView === "employee" &&
                      "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white"
                  )}
                  onClick={() => setCurrentView("employee")}
                >
                  <Users className="h-5 w-5 mr-3" />
                  <span>Employees</span>
                </Button>
                <Button
                  variant={
                    currentView === "notifications" ? "default" : "ghost"
                  }
                  className={cn(
                    "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600",
                    currentView === "notifications" &&
                      "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white"
                  )}
                  onClick={() => setCurrentView("notifications")}
                >
                  <NotificationBadge />
                  <span>Notifications</span>
                </Button>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase px-3 mb-2">
                Settings
              </h3>
              <div className="space-y-1">
                <Button
                  variant={currentView === "settings" ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base hover:bg-indigo-100 hover:text-indigo-600",
                    currentView === "settings" &&
                      "bg-indigo-600 text-white hover:bg-indigo-600/90 hover:text-white"
                  )}
                  onClick={() => setCurrentView("settings")}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-0 w-64 border-t">
          <div className="px-3 py-4">
            {/* User Profile */}
            <Profile />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {businessName.name}{" "}
              {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h2>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
