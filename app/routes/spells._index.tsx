import { useState, useMemo } from "react";
import type { Route } from "./+types/spells._index";
import { getSpells, getAvailableLevelsByClass, type SpellWithClasses } from "~/db/queries/spells";
import { FilterBar } from "~/components/filters/filter-bar";
import { SpellList } from "~/components/spell/spell-list";
import { SpellDetail } from "~/components/spell/spell-detail";
import Fuse from "fuse.js";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const classes = url.searchParams.getAll("class");
  const levels = url.searchParams.getAll("level").map(Number);

  // Récupérer les niveaux disponibles pour les classes sélectionnées
  const availableLevels = await getAvailableLevelsByClass(
    classes.length > 0 ? classes : undefined
  );

  // Charger tous les sorts sans filtre de recherche
  const spells = await getSpells({
    classes: classes.length > 0 ? classes : undefined,
    levels: levels.length > 0 ? levels : undefined,
  });

  return { spells, availableLevels };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Grimoire D&D 5e - Recherche de sorts" },
    { name: "description", content: "Recherchez et filtrez parmi 490 sorts de D&D 5e en francais" },
  ];
}

export default function SpellsIndex({ loaderData }: Route.ComponentProps) {
  const { spells, availableLevels } = loaderData;
  const [selectedSpell, setSelectedSpell] = useState<SpellWithClasses | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Configuration Fuse.js pour fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(spells, {
        keys: [
          { name: "nom", weight: 2 },           // Priorité max sur le nom
          { name: "description", weight: 0.5 }, // Moins important
        ],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
      }),
    [spells]
  );

  // Filtrer les sorts avec fuzzy search
  const filteredSpells = useMemo(() => {
    if (!searchQuery.trim()) return spells;
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, spells, fuse]);

  const handleSpellClick = (spell: SpellWithClasses) => {
    setSelectedSpell(spell);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <FilterBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        availableLevels={availableLevels}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-400">
          {filteredSpells.length} sort{filteredSpells.length !== 1 ? "s" : ""} trouvé{filteredSpells.length !== 1 ? "s" : ""}
        </p>
      </div>

      <SpellList spells={filteredSpells} onSpellClick={handleSpellClick} />

      <SpellDetail
        spell={selectedSpell}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
