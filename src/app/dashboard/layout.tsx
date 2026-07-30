import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The sidebar is a client component (it consumes the sidebar context), so its
  // data is fetched here and passed down.
  const [itemTypes, collections] = await Promise.all([
    getItemTypesWithCounts(),
    getSidebarCollections(),
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar itemTypes={itemTypes} collections={collections} />
          <main className="flex-1 overflow-y-auto px-8 py-4 lg:px-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
