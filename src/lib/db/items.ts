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

/** An item type plus how many of the user's items use it — the sidebar's rows. */
export interface ItemTypeWithCount extends ItemTypeSummary {
  itemCount: number;
}

export interface ItemStats {
  total: number;
  favorites: number;
}

const RECENT_ITEMS_LIMIT = 10;

/**
 * Display order for the system types. They have no ordering column, so the
 * sidebar's order is pinned here; custom types sort after them, alphabetically.
 */
const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

function typeOrder(name: string): number {
  const index = SYSTEM_TYPE_ORDER.indexOf(name);
  return index === -1 ? SYSTEM_TYPE_ORDER.length : index;
}

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

/**
 * Every item type available to the current user — the seven system types plus
 * any custom ones — with the number of the user's items using each.
 *
 * The counts are filtered relation counts, so this stays a single query. Unlike
 * the other fetchers this still returns the system types when there is no user,
 * because the sidebar's type list is navigation rather than data.
 */
export async function getItemTypesWithCounts(): Promise<ItemTypeWithCount[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const types = await prisma.itemType.findMany({
      where: { userId: null },
      select: { id: true, name: true, color: true },
    });

    return sortItemTypes(types.map((type) => ({ ...type, itemCount: 0 })));
  }

  const types = await prisma.itemType.findMany({
    // System types are shared (no owner); custom ones belong to the user.
    where: { OR: [{ userId: null }, { userId }] },
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { items: { where: { userId } } } },
    },
  });

  return sortItemTypes(
    types.map(({ id, name, color, _count }) => ({
      id,
      name,
      color,
      itemCount: _count.items,
    }))
  );
}

function sortItemTypes(types: ItemTypeWithCount[]): ItemTypeWithCount[] {
  return types.sort(
    (a, b) => typeOrder(a.name) - typeOrder(b.name) || a.name.localeCompare(b.name)
  );
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
