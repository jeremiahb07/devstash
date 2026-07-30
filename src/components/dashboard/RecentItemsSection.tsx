import { ItemRow } from "@/components/dashboard/ItemRow";
import type { ItemSummary } from "@/lib/db/items";

export function RecentItemsSection({ items }: { items: ItemSummary[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">Recent Items</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No items yet. Create one to start building your stash.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
