import { Layers, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="relative flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="flex size-7 items-center justify-center rounded-md bg-linear-to-br from-violet-500 to-fuchsia-500 text-white">
          <Layers className="size-4" />
        </span>
        <span className="text-lg font-semibold">DevStash</span>
      </div>
      <div className="absolute left-1/2 w-full max-w-md -translate-x-1/2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-8" disabled />
        </div>
      </div>
      <Button size="sm" className="ml-auto" disabled>
        <Plus />
        New Item
      </Button>
    </header>
  );
}
