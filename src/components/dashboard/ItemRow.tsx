import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ITEM_TYPE_ICONS } from "@/lib/constants/item-types";
import { itemTypes, type MockItem } from "@/lib/mock-data";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ItemRow({ item }: { item: MockItem }) {
  const type = itemTypes.find((t) => t.id === item.itemTypeId);
  const Icon = type ? ITEM_TYPE_ICONS[type.name] : undefined;

  return (
    <div
      className="flex items-start gap-4 rounded-xl border-l-4 bg-card p-4 ring-1 ring-foreground/10"
      style={{ borderLeftColor: type?.color ?? "var(--border)" }}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
        {Icon && <Icon className="size-4" style={{ color: type?.color }} />}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
          {item.isFavorite && <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
        </div>
        <p className="truncate text-sm text-muted-foreground">{item.description}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <span className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground">
        {formatDate(item.createdAt)}
      </span>
    </div>
  );
}
