import { useState } from "react";
import type { Route } from "./+types/monsters.favorites";
import { Link } from "react-router";
import { Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { requireAuth } from "~/lib/requireAuth.server";
import { getFavoriteMonstersByUser } from "~/db/queries/favorite-monsters.server";
import type { MonsterWithContent } from "~/db/queries/monsters.server";
import { MonsterList } from "~/components/monster/monster-list";
import { MonsterDetail } from "~/components/monster/monster-detail";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const favoriteMonsters = await getFavoriteMonstersByUser(user.id);
  return { favoriteMonsters };
}

export function meta() {
  return [
    { title: "Monstres favoris - Bestiaire D&D 5e" },
    { name: "description", content: "Vos monstres favoris" },
  ];
}

export default function FavoriteMonsters({ loaderData }: Route.ComponentProps) {
  const { favoriteMonsters } = loaderData;
  const [selectedMonster, setSelectedMonster] = useState<MonsterWithContent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleMonsterClick = (monster: MonsterWithContent) => {
    setSelectedMonster(monster);
    setDetailOpen(true);
  };

  const favoriteIds = favoriteMonsters.map((monster) => monster.id);

  if (favoriteMonsters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Star className="h-16 w-16 text-stone-600 mb-4" />
        <h3 className="text-xl font-semibold text-stone-300 mb-2">Aucun favori</h3>
        <p className="text-stone-500 max-w-md mb-4">
          Ajoutez des monstres en favoris depuis le bestiaire pour les retrouver ici.
        </p>
        <Link to="/monsters">
          <Button>Voir le bestiaire</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-100 flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-400 fill-current" />
          Monstres favoris
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          {favoriteMonsters.length} monstre{favoriteMonsters.length !== 1 ? "s" : ""} en favoris
        </p>
      </div>

      <MonsterList
        monsters={favoriteMonsters}
        onMonsterClick={handleMonsterClick}
        favoriteMonsterIds={favoriteIds}
        isLoggedIn
      />

      <MonsterDetail
        monster={selectedMonster}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isFavorite={selectedMonster ? favoriteIds.includes(selectedMonster.id) : false}
        isLoggedIn
      />
    </div>
  );
}
