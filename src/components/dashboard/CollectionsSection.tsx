import Link from "next/link";
import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import type { CollectionSummary } from "@/lib/db/collections";

function CollectionCard({ collection }: { collection: CollectionSummary }) {
  return (
    <Link href={`/collections/${collection.id}`} className="block">
      <Card
        className="h-full border-l-4 transition-colors hover:bg-muted/50"
        style={{ borderLeftColor: collection.accentColor ?? "var(--border)" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <span className="truncate">{collection.name}</span>
            {collection.isFavorite && (
              <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </p>
          {collection.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
          {collection.types.length > 0 && (
            <div className="flex items-center gap-2">
              {collection.types.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type.name];
                return Icon ? (
                  <Icon
                    key={type.id}
                    className="size-4"
                    style={{ color: type.color }}
                    aria-label={`${type.count} ${type.name}${type.count === 1 ? "" : "s"}`}
                  />
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function CollectionsSection({
  collections,
}: {
  collections: CollectionSummary[];
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Collections</h2>
        <Link href="/collections" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>
      {collections.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No collections yet. Create one to start organizing your items.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </section>
  );
}
