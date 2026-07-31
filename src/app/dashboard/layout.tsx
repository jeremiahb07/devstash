import { redirect } from "next/navigation";

import { auth } from "@/auth";
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
  const [session, itemTypes, collections] = await Promise.all([
    auth(),
    getItemTypesWithCounts(),
    getSidebarCollections(),
  ]);

  // The proxy already turns signed-out traffic away from /dashboard, so this is
  // a type guard more than a branch — but the layout must not render a footer
  // for nobody if that ever stops being true.
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            itemTypes={itemTypes}
            collections={collections}
            user={session.user}
          />
          <main className="flex-1 overflow-y-auto px-8 py-4 lg:px-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
