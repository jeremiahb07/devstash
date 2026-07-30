import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import type { Prisma } from "@/generated/prisma/client";

/** One item type present in a collection, with how many items use it. */
export interface CollectionTypeSummary {
  id: string;
  name: string;
  color: string;
  count: number;
}

/** A collection shaped for the dashboard's collection cards. */
export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  /** Item types present in the collection, most-used first. */
  types: CollectionTypeSummary[];
  /** Colour of the most-used type — the card's accent. Null when empty. */
  accentColor: string | null;
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

/** The sidebar's two collection groups. */
export interface SidebarCollections {
  favorites: CollectionSummary[];
  recent: CollectionSummary[];
}

const RECENT_COLLECTIONS_LIMIT = 6;
const SIDEBAR_COLLECTIONS_LIMIT = 5;

/** Everything a collection card or sidebar row renders. */
const collectionSummarySelect = {
  id: true,
  name: true,
  description: true,
  isFavorite: true,
  _count: { select: { items: true } },
  defaultType: { select: { color: true } },
  items: {
    select: {
      item: {
        select: {
          itemType: { select: { id: true, name: true, color: true } },
        },
      },
    },
  },
} satisfies Prisma.CollectionSelect;

type CollectionSummaryRow = Prisma.CollectionGetPayload<{
  select: typeof collectionSummarySelect;
}>;

/**
 * Item types in a collection, ordered by how many items use each one. Ties
 * break on name so the icon row and accent colour stay stable between renders.
 */
function summarizeTypes(
  memberships: { item: { itemType: { id: string; name: string; color: string } } }[]
): CollectionTypeSummary[] {
  const byType = new Map<string, CollectionTypeSummary>();

  for (const { item } of memberships) {
    const { id, name, color } = item.itemType;
    const existing = byType.get(id);

    if (existing) {
      existing.count += 1;
    } else {
      byType.set(id, { id, name, color, count: 1 });
    }
  }

  return [...byType.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

function toCollectionSummary(collection: CollectionSummaryRow): CollectionSummary {
  const types = summarizeTypes(collection.items);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection._count.items,
    types,
    // An empty collection has no most-used type — fall back to its default
    // type so the card still reads as belonging to that type.
    accentColor: types[0]?.color ?? collection.defaultType?.color ?? null,
  };
}

/**
 * The most recently updated collections for the current user, with the item
 * count and type breakdown each card needs.
 *
 * The type breakdown is joined in rather than counted per collection to keep
 * this a single query.
 */
export async function getRecentCollections(
  limit: number = RECENT_COLLECTIONS_LIMIT
): Promise<CollectionSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: collectionSummarySelect,
  });

  return collections.map(toCollectionSummary);
}

/**
 * The sidebar's collection groups: the user's favorites, and their most
 * recently updated non-favorite collections. Split into two queries so each
 * group gets its own limit; favorites are excluded from Recent so a collection
 * never appears twice.
 */
export async function getSidebarCollections(
  limit: number = SIDEBAR_COLLECTIONS_LIMIT
): Promise<SidebarCollections> {
  const userId = await getCurrentUserId();
  if (!userId) return { favorites: [], recent: [] };

  const [favorites, recent] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: collectionSummarySelect,
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: false },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: collectionSummarySelect,
    }),
  ]);

  return {
    favorites: favorites.map(toCollectionSummary),
    recent: recent.map(toCollectionSummary),
  };
}

/** Collection totals for the dashboard stats cards. */
export async function getCollectionStats(): Promise<CollectionStats> {
  const userId = await getCurrentUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
