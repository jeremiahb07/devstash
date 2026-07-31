"use client";

import Link from "next/link";
import { ChevronDown, LogOut, PanelLeft, Star } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ITEM_TYPE_ICONS,
  isProItemType,
  itemTypeRoute,
} from "@/lib/constants/item-types";
import type { CollectionSummary, SidebarCollections } from "@/lib/db/collections";
import type { ItemTypeWithCount } from "@/lib/db/items";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";

/** The fields of the session user the footer actually renders. */
export interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface SidebarProps {
  itemTypes: ItemTypeWithCount[];
  collections: SidebarCollections;
  user: SidebarUser;
}

function ProBadge() {
  return (
    <Badge
      variant="outline"
      className="h-4 px-1.5 text-[10px] tracking-wide text-muted-foreground uppercase"
    >
      PRO
    </Badge>
  );
}

function TypesSection({
  types,
  collapsed,
}: {
  types: ItemTypeWithCount[];
  collapsed: boolean;
}) {
  const typeLinks = types.map((type) => {
    const Icon = ITEM_TYPE_ICONS[type.name];
    const count = type.itemCount;
    const isPro = isProItemType(type.name);
    const link = (
      <Link
        href={itemTypeRoute(type.name)}
        className={cn(
          "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm capitalize hover:bg-muted",
          collapsed && "justify-center px-0"
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          {Icon && <Icon className="size-4 shrink-0" style={{ color: type.color }} />}
          {!collapsed && (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{type.name}s</span>
              {isPro && <ProBadge />}
            </span>
          )}
        </span>
        {!collapsed && <span className="text-xs text-muted-foreground">{count}</span>}
      </Link>
    );

    if (!collapsed) {
      return <div key={type.id}>{link}</div>;
    }

    return (
      <Tooltip key={type.id}>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">
          {type.name}s ({count}){isPro && " · PRO"}
        </TooltipContent>
      </Tooltip>
    );
  });

  if (collapsed) {
    return <div className="space-y-0.5">{typeLinks}</div>;
  }

  return (
    <div>
      <p className="px-1 py-1 text-xs font-medium text-muted-foreground">TYPES</p>
      <div className="mt-1 space-y-0.5">{typeLinks}</div>
    </div>
  );
}


function CollectionLink({
  collection,
  children,
}: {
  collection: CollectionSummary;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="truncate">{collection.name}</span>
      </span>
      {children}
    </Link>
  );
}

function CollectionsSection({ collections }: { collections: SidebarCollections }) {
  const { favorites, recent } = collections;
  const isEmpty = favorites.length === 0 && recent.length === 0;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group inline-flex items-center gap-1 px-1 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
        COLLECTIONS
        <ChevronDown className="size-3.5 transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-3">
        {favorites.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-2 text-[0.80rem] font-medium tracking-wide text-muted-foreground">
              Favorites
            </p>
            {favorites.map((collection) => (
              <CollectionLink key={collection.id} collection={collection}>
                <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
              </CollectionLink>
            ))}
          </div>
        )}

        {recent.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-2 text-[0.80rem] font-medium tracking-wide text-muted-foreground">
              Recent
            </p>
            {recent.map((collection) => (
              <CollectionLink key={collection.id} collection={collection}>
                {/* Dot tinted by the collection's most-used item type. */}
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: collection.accentColor ?? "var(--border)",
                  }}
                  aria-hidden
                />
              </CollectionLink>
            ))}
          </div>
        )}

        {isEmpty ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No collections yet
          </p>
        ) : (
          <Link
            href="/collections"
            className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            View all collections
          </Link>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function UserFooter({
  user,
  collapsed,
}: {
  user: SidebarUser;
  collapsed: boolean;
}) {
  // Every field on the session user is optional — a GitHub account can arrive
  // without a display name, and an OAuth profile with a private email address
  // without one of those either — so the label degrades through both.
  const displayName = user.name?.trim() || user.email || "Your account";

  return (
    <div
      className={cn(
        "flex items-center border-t border-border p-3",
        collapsed && "justify-center"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Account menu"
              className={cn(
                // Tailwind v4 resets buttons to `cursor: default`, so the
                // pointer has to be asked for to match the links above it.
                "flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left hover:bg-muted",
                !collapsed && "-mx-1 flex-1 px-1 py-1"
              )}
            >
              <UserAvatar
                size="sm"
                name={user.name}
                email={user.email}
                image={user.image}
              />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {displayName}
                  </span>
                  {/* Skipped when the email is the label already, or absent. */}
                  {user.email && user.email !== displayName && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </span>
              )}
            </button>
          }
        />
        {/* The footer sits at the bottom of the viewport, so the menu opens
            upward. Anchor width would match the narrow trigger on the collapsed
            rail, hence the fixed width. */}
        <DropdownMenuContent side="top" align="start" className="w-52">
          {/* The name block is the way to the profile — `min-w-0` on the item
              and `w-full` on the lines so a long email truncates instead of
              widening the menu. */}
          <DropdownMenuLinkItem
            render={<Link href="/profile" />}
            className="min-w-0 flex-col items-start gap-0 py-1.5"
          >
            <span className="w-full truncate text-sm font-medium">
              {displayName}
            </span>
            {user.email && user.email !== displayName && (
              <span className="w-full truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            )}
          </DropdownMenuLinkItem>
          <DropdownMenuSeparator />
          {/* A form, so signing out is a POST rather than something a link
              prefetch could trigger on its own. */}
          <form action={signOutAction}>
            <DropdownMenuItem
              render={<button type="submit" className="w-full" />}
              nativeButton
              variant="destructive"
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SidebarNav({
  itemTypes,
  collections,
  user,
  collapsed,
  showToggle,
}: SidebarProps & { collapsed: boolean; showToggle?: boolean }) {
  const { toggleSidebar } = useSidebar();

  return (
    <TooltipProvider>
      <div className="flex h-full w-full flex-col">
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b border-border p-3",
            collapsed && "justify-center"
          )}
        >
          {!collapsed && <span className="text-sm font-medium">Navigation</span>}
          {showToggle && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <PanelLeft />
            </Button>
          )}
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          <TypesSection types={itemTypes} collapsed={collapsed} />
          {!collapsed && (
            <>
              <Separator />
              <CollectionsSection collections={collections} />
            </>
          )}
        </nav>
        <UserFooter user={user} collapsed={collapsed} />
      </div>
    </TooltipProvider>
  );
}

export function Sidebar({ itemTypes, collections, user }: SidebarProps) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarNav
          itemTypes={itemTypes}
          collections={collections}
          user={user}
          collapsed={collapsed}
          showToggle
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-56 p-0">
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <SidebarNav
            itemTypes={itemTypes}
            collections={collections}
            user={user}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
