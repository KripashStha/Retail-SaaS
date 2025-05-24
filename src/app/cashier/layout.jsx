import { CashierSidebar } from "@/components/cashier-sidebar";
import { PageTitle } from "@/components/page-title";
import { requireRole, getBusinessData } from "@/lib/server-auth";
import SidebarToggle from "@/components/sidebar-toggle";

// Force dynamic rendering for this layout and all its child routes
export const dynamic = "force-dynamic";

export default async function CashierLayout({ children }) {
  // Handle authentication and role authorization on the server
  const { userId, userRole } = await requireRole(["cashier"]);

  // Get business data on the server
  const businessData = await getBusinessData(userId);

  // role = getCurrentUserRole(userId);
  // if (role !== "admin") redirect("/unauthorized");
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CashierSidebar businessName={businessData} />
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 flex flex-col relative">
        <div className="flex items-center">
          {/* Sidebar Toggle Button - Client Component */}
          <SidebarToggle />
          {/* Page Title - now inline with toggle button */}
          <div className="flex-1">
            <PageTitle businessName={businessData} />
          </div>
        </div>
        <div className="flex-1 space-y-4 pt-1 lg:pt-0 lg:box-border p-4 md:pl-8">
          {children}
        </div>
      </div>
    </div>
  );
}
