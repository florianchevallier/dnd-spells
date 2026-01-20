import { useState, useMemo } from "react";
import type { Route } from "./+types/spells._index";
import { getSpells, getAvailableLevelsByClass, type SpellWithClasses } from "~/db/queries/spells.server";
import {
  getCharactersByUserId,
  getCharacterById,
  getSpellSlotsForCharacter,
  getAvailableSpellLevelsFromSlots,
  type CharacterWithDetails,
} from "~/db/queries/characters.server";
import { getOptionalUser } from "~/lib/requireAuth.server";
import { FilterBar } from "~/components/filters/filter-bar";
import { SpellList } from "~/components/spell/spell-list";
import { SpellDetail } from "~/components/spell/spell-detail";
import Fuse from "fuse.js";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const classes = url.searchParams.getAll("class");
  const levels = url.searchParams.getAll("level").map(Number);
  const characterId = url.searchParams.get("character");

  // Get optional user for character filtering
  const user = await getOptionalUser(request);

  // Get user's characters if logged in
  const characters: CharacterWithDetails[] = user
    ? await getCharactersByUserId(user.id)
    : [];

  // Get selected character details if specified
  let selectedCharacter: CharacterWithDetails | null = null;
  let characterAvailableLevels: number[] | null = null;

  if (characterId && user) {
    selectedCharacter = await getCharacterById(Number(characterId), user.id);

    if (selectedCharacter) {
      // Get spell slots for this character
      const spellSlots = await getSpellSlotsForCharacter(
        selectedCharacter.classId,
        selectedCharacter.subclassId,
        selectedCharacter.level
      );

      if (spellSlots) {
        characterAvailableLevels = getAvailableSpellLevelsFromSlots(spellSlots);
      }
    }
  }

  // Determine effective filters based on character selection
  const effectiveClasses = selectedCharacter
    ? [selectedCharacter.class.nom]
    : classes.length > 0
      ? classes
      : undefined;

  // Filter levels to only include those available for the character
  const effectiveLevels =
    levels.length > 0
      ? characterAvailableLevels
        ? levels.filter((l) => characterAvailableLevels!.includes(l))
        : levels
      : characterAvailableLevels || undefined;

  // Récupérer les niveaux disponibles pour les classes sélectionnées
  const availableLevels = await getAvailableLevelsByClass(effectiveClasses);

  // Charger tous les sorts avec les filtres effectifs
  const spells = await getSpells({
    classes: effectiveClasses,
    levels: effectiveLevels && effectiveLevels.length > 0 ? effectiveLevels : undefined,
  });

  return {
    spells,
    availableLevels,
    isLoggedIn: !!user,
    characters,
    selectedCharacter,
    characterAvailableLevels,
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Grimoire D&D 5e - Recherche de sorts" },
    { name: "description", content: "Recherchez et filtrez parmi 490 sorts de D&D 5e en francais" },
  ];
}

export default function SpellsIndex({ loaderData }: Route.ComponentProps) {
  const {
    spells,
    availableLevels,
    isLoggedIn,
    characters,
    selectedCharacter,
    characterAvailableLevels,
  } = loaderData;
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
        isLoggedIn={isLoggedIn}
        characters={characters}
        selectedCharacter={selectedCharacter}
        characterAvailableLevels={characterAvailableLevels}
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
