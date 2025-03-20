"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { InventoryTracking } from "@/components/product-management";
import { PointOfSale } from "@/components/point-of-sale";
import { AlertSystem } from "@/components/alert-system";
import  Employee  from "@/components/Employee";
import {
  AlertTriangle,
  DollarSign,
  Package2,
  Terminal,
  Package,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Settings,
  ChevronDown,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { db, auth } from "@/firebase/dbConfig";
import { getDoc, doc, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import  Profile from "@/components/Profile";
import { NotificationSystem } from "@/components/notification-system";
import { SettingsPanel } from "@/components/settings-panel";
import { NotificationBadge } from "@/components/notification-badge";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [businessName, setBusinessName] = useState("");

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Inventory Items
                  </CardTitle>
                  <Package2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +34 from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Low Stock Items
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">
                    +5 from yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Sales
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$4,329.00</div>
                  <p className="text-xs text-muted-foreground">
                    +19% from yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active POS Terminals
                  </CardTitle>
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">2 inactive</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    You made 265 sales this month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </div>
        );
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
      <div className="w-64 border-r bg-gray-50">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Package className="h-6 w-6 text-indigo-600 " />
          <span className="font-semibold text-xl text-indigo-600">
            Easy Inventory
          </span>
        </div>

        {/* Main Navigation */}
        <div className="px-3 py-4">
          <nav className="space-y-1">
            <Button
              variant={currentView === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start text-base hover:bg-indigo-600/70 hover:text-white"
              onClick={() => setCurrentView("dashboard")}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={currentView === "inventory" ? "secondary" : "ghost"}
              className="w-full justify-start text-base hover:bg-indigo-600/70 hover:text-white"
              onClick={() => setCurrentView("inventory")}
            >
              <Package className="h-5 w-5 mr-3" />
              <span>Inventory</span>
            </Button>
            <Button
              variant={currentView === "pos" ? "secondary" : "ghost"}
              className="w-full justify-start text-base hover:bg-indigo-600/70 hover:text-white"
              onClick={() => setCurrentView("pos")}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <span>Point of Sale</span>
            </Button>
            <Button
              variant={currentView === "employee" ? "secondary" : "ghost"}
              className="w-full justify-start text-base hover:bg-indigo-600/70 hover:text-white"
              onClick={() => setCurrentView("employee")}
            >
              <Users className="h-5 w-5 mr-3" />
              <span>Employees</span>
            </Button>
            <Button
              variant={currentView === "notifications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentView("notifications")}
            >
              
                <NotificationBadge className="h-5 w-5 mr-3"/>
                <span className="ml-2">Notifications</span>
              
            </Button>
            <Button
              variant={currentView === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentView("settings")}
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-0 w-64 border-t">
          <div className="px-3 py-4">
            {/* <nav className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-base hover:bg-indigo-600/70 hover:text-white"
                onClick={() => setCurrentView("alerts")}
              >
                <Bell className="h-5 w-5 mr-3" />
                <span>Notifications</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base hover:bg-indigo-600/70 hover:text-white"
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>Settings</span>
              </Button>
            </nav> */}

            {/* User Profile */}
            <Profile/>
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
