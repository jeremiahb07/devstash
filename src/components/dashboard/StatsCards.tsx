import { FolderOpen, Heart, LayoutGrid, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

export function StatsCards({
  totalItems,
  totalCollections,
  favoriteItems,
  favoriteCollections,
}: StatsCardsProps) {
  const stats = [
    { label: "Items", value: totalItems, icon: LayoutGrid },
    { label: "Collections", value: totalCollections, icon: FolderOpen },
    { label: "Favorite Items", value: favoriteItems, icon: Star },
    { label: "Favorite Collections", value: favoriteCollections, icon: Heart },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
            <Icon className="size-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
