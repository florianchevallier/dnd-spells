import { Shield, Heart, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { MonsterWithContent } from "~/db/queries/monsters.server";
import { FavoriteMonsterButton } from "~/components/favorites/favorite-monster-button";
import { MonsterImage } from "./monster-image";

interface MonsterCardProps {
  monster: MonsterWithContent;
  onClick?: () => void;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
}

export function MonsterCard({
  monster,
  onClick,
  isFavorite = false,
  isLoggedIn = false,
}: MonsterCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-amber-700 hover:shadow-amber-900/20 hover:shadow-xl group flex flex-col h-full overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-[4/3] overflow-hidden border-b border-stone-800">
        <MonsterImage
          src={monster.imageUrl}
          alt={monster.name}
          fit="contain"
          fallbackMode="placeholder"
          className="bg-stone-900 group-hover:scale-[1.02] transition-transform"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base group-hover:text-amber-200 transition-colors line-clamp-2">
            {monster.name}
          </CardTitle>
          <FavoriteMonsterButton
            monsterId={monster.id}
            isFavorite={isFavorite}
            isLoggedIn={isLoggedIn}
            size="sm"
          />
        </div>
        <Badge variant="outline" className="w-fit">
          {monster.type}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-3 gap-2 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 shrink-0" />
            <span className="truncate">{monster.ac || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3 w-3 shrink-0" />
            <span className="truncate">{monster.hp || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3 w-3 shrink-0" />
            <span className="truncate">{monster.speed || "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
