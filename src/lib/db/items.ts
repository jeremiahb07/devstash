import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import type { Prisma } from "@/generated/prisma/client";

/** The item's type, carrying the icon name and accent colour a card needs. */
export interface ItemTypeSummary {
  id: string;
  name: string;
  color: string;
}

/** An item shaped for the dashboard's item rows. */
export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: string[];
  type: ItemTypeSummary;
}

export interface ItemStats {
  total: number;
  favorites: number;
}

const RECENT_ITEMS_LIMIT = 10;

/** Everything an item row renders — shared by the pinned and recent queries. */
const itemSummarySelect = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  itemType: { select: { id: true, name: true, color: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.ItemSelect;

type ItemSummaryRow = Prisma.ItemGetPayload<{ select: typeof itemSummarySelect }>;

function toItemSummary(item: ItemSummaryRow): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    tags: item.tags.map((tag) => tag.name),
    type: item.itemType,
  };
}

/**
 * The current user's pinned items, newest first. Returns an empty array when
 * nothing is pinned — the dashboard hides the section in that case.
 */
export async function getPinnedItems(): Promise<ItemSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { createdAt: "desc" },
    select: itemSummarySelect,
  });

  return items.map(toItemSummary);
}

/** The current user's most recently created items. */
export async function getRecentItems(
  limit: number = RECENT_ITEMS_LIMIT
): Promise<ItemSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: itemSummarySelect,
  });

  return items.map(toItemSummary);
}

/** Item totals for the dashboard stats cards. */
export async function getItemStats(): Promise<ItemStats> {
  const userId = await getCurrentUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
