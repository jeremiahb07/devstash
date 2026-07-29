import { Pin } from "lucide-react";

import { ItemRow } from "@/components/dashboard/ItemRow";
import { items } from "@/lib/mock-data";

export function PinnedItemsSection() {
  const pinnedItems = items.filter((item) => item.isPinned);

  if (pinnedItems.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <Pin className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Pinned</h2>
      </div>
      <div className="mt-4 space-y-3">
        {pinnedItems.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
