import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link,
  type LucideIcon,
} from "lucide-react";

export const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: Image,
  link: Link,
};

export const ITEM_TYPE_COLORS: Record<string, string> = {
  snippet: "#3b82f6",
  prompt: "#8b5cf6",
  command: "#f97316",
  note: "#fde047",
  file: "#6b7280",
  image: "#ec4899",
  link: "#10b981",
};

// Item types gated behind the Pro tier (see context/project-overview.md).
export const PRO_ITEM_TYPES = new Set(["file", "image"]);

export function isProItemType(name: string) {
  return PRO_ITEM_TYPES.has(name);
}

export function itemTypeRoute(name: string) {
  return `/items/${name}s`;
}
