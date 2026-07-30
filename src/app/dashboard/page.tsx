import { CollectionsSection } from "@/components/dashboard/CollectionsSection";
import { PinnedItemsSection } from "@/components/dashboard/PinnedItemsSection";
import { RecentItemsSection } from "@/components/dashboard/RecentItemsSection";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getItemStats, getPinnedItems, getRecentItems } from "@/lib/db/items";

export default async function DashboardPage() {
  const [collections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getRecentCollections(),
      getCollectionStats(),
      getPinnedItems(),
      getRecentItems(),
      getItemStats(),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>
      <StatsCards
        totalItems={itemStats.total}
        totalCollections={collectionStats.total}
        favoriteItems={itemStats.favorites}
        favoriteCollections={collectionStats.favorites}
      />
      <CollectionsSection collections={collections} />
      <PinnedItemsSection items={pinnedItems} />
      <RecentItemsSection items={recentItems} />
    </div>
  );
}
