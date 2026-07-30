import { CollectionsSection } from "@/components/dashboard/CollectionsSection";
import { PinnedItemsSection } from "@/components/dashboard/PinnedItemsSection";
import { RecentItemsSection } from "@/components/dashboard/RecentItemsSection";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { items } from "@/lib/mock-data";

export default async function DashboardPage() {
  const [collections, collectionStats] = await Promise.all([
    getRecentCollections(),
    getCollectionStats(),
  ]);

  // Items are still mock data — they move to the database in a later feature.
  const totalItems = items.length;
  const favoriteItems = items.filter((item) => item.isFavorite).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>
      <StatsCards
        totalItems={totalItems}
        totalCollections={collectionStats.total}
        favoriteItems={favoriteItems}
        favoriteCollections={collectionStats.favorites}
      />
      <CollectionsSection collections={collections} />
      <PinnedItemsSection />
      <RecentItemsSection />
    </div>
  );
}
