import type { MonsterWithContent } from "~/db/queries/monsters.server";
import { MonsterCard } from "./monster-card";

interface MonsterListProps {
  monsters: MonsterWithContent[];
  onMonsterClick: (monster: MonsterWithContent) => void;
  favoriteMonsterIds?: number[];
  isLoggedIn?: boolean;
}

export function MonsterList({
  monsters,
  onMonsterClick,
  favoriteMonsterIds = [],
  isLoggedIn = false,
}: MonsterListProps) {
  if (monsters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🐲</div>
        <h3 className="text-xl font-semibold text-stone-300 mb-2">Aucun monstre trouvé</h3>
        <p className="text-stone-500 max-w-md">
          Essayez une autre recherche pour trouver une créature.
        </p>
      </div>
    );
  }

  const favoriteSet = new Set(favoriteMonsterIds);

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {monsters.map((monster) => (
        <MonsterCard
          key={monster.id}
          monster={monster}
          onClick={() => onMonsterClick(monster)}
          isFavorite={favoriteSet.has(monster.id)}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </div>
  );
}
