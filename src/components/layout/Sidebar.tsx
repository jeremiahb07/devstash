"use client";

import Link from "next/link";
import { ChevronDown, PanelLeft, Settings, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";

export interface SidebarProps {
  itemTypes: ItemTypeWithCount[];
  collections: SidebarCollections;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function UserFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-t border-border p-3",
        collapsed && "justify-center"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={currentUser.image ?? undefined} alt={currentUser.name} />
          <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <span className="min-w-0">
            <p className="truncate text-sm font-medium">{currentUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
          </span>
        )}
      </span>
      {!collapsed && (
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <Settings className="size-4" />
        </Link>
      )}
    </div>
  );
}

function SidebarNav({
  itemTypes,
  collections,
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
        <UserFooter collapsed={collapsed} />
      </div>
    </TooltipProvider>
  );
}

export function Sidebar({ itemTypes, collections }: SidebarProps) {
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
            collapsed={false}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
