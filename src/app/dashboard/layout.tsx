import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

/** Clears the cookie and lands on `/sign-in`; a layout cannot do either. */
const STALE_SESSION_ROUTE = "/api/auth/stale-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The sidebar is a client component (it consumes the sidebar context), so its
  // data is fetched here and passed down. The user comes from the database
  // rather than the session so the footer shows their current name, email and
  // avatar instead of whatever they were when the token was minted.
  const [user, itemTypes, collections] = await Promise.all([
    getCurrentUser(),
    getItemTypesWithCounts(),
    getSidebarCollections(),
  ]);

  // Null covers both "no session" — which the proxy already turns away, so it is
  // a type guard more than a branch — and "the session names a user who no
  // longer exists", which nothing else in the app would notice: the cookie stays
  // valid for weeks, and every query below it would quietly come back empty.
  if (!user) {
    redirect(STALE_SESSION_ROUTE);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            itemTypes={itemTypes}
            collections={collections}
            user={user}
          />
          <main className="flex-1 overflow-y-auto px-8 py-4 lg:px-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
