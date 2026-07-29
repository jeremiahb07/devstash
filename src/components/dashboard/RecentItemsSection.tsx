import { ItemRow } from "@/components/dashboard/ItemRow";
import { items } from "@/lib/mock-data";

export function RecentItemsSection() {
  const recentItems = items
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 10);

  return (
    <section>
      <h2 className="text-lg font-semibold">Recent Items</h2>
      <div className="mt-4 space-y-3">
        {recentItems.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
