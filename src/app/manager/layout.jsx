import { ManagerSidebar } from "@/components/manager-sidebar";
import { PageTitle } from "@/components/page-title";
import { requireAuth, getBusinessData } from "@/lib/server-auth";

// Force dynamic rendering for this layout and all its child routes
export const dynamic = "force-dynamic";

export default async function ManagerLayout({ children }) {
  // Handle authentication on the server
  const userId = await requireAuth();

  // Get business data on the server
  const businessData = await getBusinessData(userId);

  // role = getCurrentUserRole(userId);
  // if (role !== "admin") redirect("/unauthorized");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ManagerSidebar businessName={businessData} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-w-0 flex flex-col relative">
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <PageTitle businessName={businessData} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
