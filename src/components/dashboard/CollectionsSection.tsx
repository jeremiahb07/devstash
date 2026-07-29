import Link from "next/link";
import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import { collections, items, itemTypes, type MockCollection } from "@/lib/mock-data";

function CollectionCard({ collection }: { collection: MockCollection }) {
  const defaultType = itemTypes.find((type) => type.id === collection.defaultTypeId);
  const collectionItems = items.filter((item) => item.collectionIds.includes(collection.id));
  const typesInCollection = Array.from(new Set(collectionItems.map((item) => item.itemTypeId)))
    .map((typeId) => itemTypes.find((type) => type.id === typeId))
    .filter((type): type is NonNullable<typeof type> => Boolean(type));

  return (
    <Link href={`/collections/${collection.id}`} className="block">
      <Card
        className="h-full border-l-4 transition-colors hover:bg-muted/50"
        style={{ borderLeftColor: defaultType?.color ?? "var(--border)" }}
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
          <p className="text-xs text-muted-foreground">{collectionItems.length} items</p>
          <p className="text-sm text-muted-foreground">{collection.description}</p>
          {typesInCollection.length > 0 && (
            <div className="flex items-center gap-2">
              {typesInCollection.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type.name];
                return Icon ? (
                  <Icon key={type.id} className="size-4" style={{ color: type.color }} />
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function CollectionsSection() {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Collections</h2>
        <Link href="/collections" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
