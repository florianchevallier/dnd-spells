import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { Route } from "./+types/monsters._index";
import { Input } from "~/components/ui/input";
import { MonsterList } from "~/components/monster/monster-list";
import { MonsterDetail } from "~/components/monster/monster-detail";
import {
  getAvailableMonsterTypes,
  getMonsters,
  type MonsterWithContent,
} from "~/db/queries/monsters.server";
import { getOptionalUser } from "~/lib/requireAuth.server";
import { getFavoriteMonsterIds } from "~/db/queries/favorite-monsters.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  const [monsters, types, favoriteMonsterIds] = await Promise.all([
    getMonsters(),
    getAvailableMonsterTypes(),
    user ? getFavoriteMonsterIds(user.id) : Promise.resolve([]),
  ]);

  return {
    monsters,
    types,
    favoriteMonsterIds,
    isLoggedIn: !!user,
  };
}

export function meta() {
  return [
    { title: "Bestiaire D&D 5e" },
    { name: "description", content: "Consultez et recherchez les monstres de D&D 5e" },
  ];
}

export default function MonstersIndex({ loaderData }: Route.ComponentProps) {
  const { monsters, types, favoriteMonsterIds, isLoggedIn } = loaderData;
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMonster, setSelectedMonster] = useState<MonsterWithContent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(monsters, {
        keys: [
          { name: "name", weight: 2 },
          { name: "descriptionText", weight: 0.6 },
          { name: "type", weight: 0.8 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [monsters]
  );

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return monsters;
    return fuse.search(search).map((result) => result.item);
  }, [search, monsters, fuse]);

  const filteredMonsters = useMemo(() => {
    if (selectedType === "all") return filteredBySearch;
    return filteredBySearch.filter((monster) => monster.type === selectedType);
  }, [filteredBySearch, selectedType]);

  const handleMonsterClick = (monster: MonsterWithContent) => {
    setSelectedMonster(monster);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-amber-100">Bestiaire</h1>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">
          <Input
            placeholder="Rechercher un monstre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="h-10 rounded-md border border-stone-800 bg-stone-900 px-3 text-sm text-stone-200"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Tous les types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-400">
          {filteredMonsters.length} monstre{filteredMonsters.length !== 1 ? "s" : ""} trouvé
          {filteredMonsters.length !== 1 ? "s" : ""}
        </p>
      </div>

      <MonsterList
        monsters={filteredMonsters}
        onMonsterClick={handleMonsterClick}
        favoriteMonsterIds={favoriteMonsterIds}
        isLoggedIn={isLoggedIn}
      />

      <MonsterDetail
        monster={selectedMonster}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isFavorite={selectedMonster ? favoriteMonsterIds.includes(selectedMonster.id) : false}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
