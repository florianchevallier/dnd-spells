import { useSearchParams } from "react-router";
import { ClassFilter } from "./class-filter";
import { LevelFilter } from "./level-filter";
import { SearchInput } from "./search-input";
import { CharacterFilter } from "./character-filter";
import { Button } from "~/components/ui/button";
import { X, User } from "lucide-react";
import type { CharacterWithDetails } from "~/db/queries/characters.server";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableLevels?: number[];
  // Character filtering props
  isLoggedIn: boolean;
  characters: CharacterWithDetails[];
  selectedCharacter: CharacterWithDetails | null;
  characterAvailableLevels: number[] | null;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  availableLevels,
  isLoggedIn,
  characters,
  selectedCharacter,
  characterAvailableLevels,
}: FilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedClasses = searchParams.getAll("class");
  const selectedLevels = searchParams.getAll("level").map(Number);
  const selectedCharacterId = searchParams.get("character")
    ? Number(searchParams.get("character"))
    : null;

  // When a character is selected, use character's class for filtering
  const effectiveClasses = selectedCharacter
    ? [selectedCharacter.class.nom]
    : selectedClasses;

  // Determine available levels based on character selection
  const effectiveAvailableLevels = characterAvailableLevels || availableLevels;

  const hasFilters =
    selectedClasses.length > 0 ||
    selectedLevels.length > 0 ||
    searchQuery ||
    selectedCharacterId;

  const handleCharacterChange = (characterId: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (characterId) {
      newParams.set("character", characterId.toString());
      // Clear class filter when selecting a character (character determines the class)
      newParams.delete("class");
      // Also clear level filters that are no longer valid
      newParams.delete("level");
    } else {
      newParams.delete("character");
    }
    setSearchParams(newParams);
  };

  const handleClassChange = (classes: string[]) => {
    // Don't allow class change when character is selected
    if (selectedCharacter) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.delete("class");
    classes.forEach((c) => newParams.append("class", c));
    setSearchParams(newParams);
  };

  const handleLevelChange = (levels: number[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("level");

    // Filter levels to only include those available for the character
    const validLevels = characterAvailableLevels
      ? levels.filter((l) => characterAvailableLevels.includes(l))
      : levels;

    validLevels.forEach((l) => newParams.append("level", l.toString()));
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    onSearchChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <CharacterFilter
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onChange={handleCharacterChange}
            isLoggedIn={isLoggedIn}
          />
          <ClassFilter
            selectedClasses={effectiveClasses}
            onChange={handleClassChange}
            disabled={!!selectedCharacter}
          />
          <LevelFilter
            selectedLevels={selectedLevels}
            onChange={handleLevelChange}
            availableLevels={effectiveAvailableLevels}
            disabledLevels={
              characterAvailableLevels
                ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
                    (l) => !characterAvailableLevels.includes(l)
                  )
                : undefined
            }
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
          {selectedCharacter && (
            <span className="px-2 py-1 bg-purple-950 text-purple-300 rounded-md whitespace-nowrap flex items-center gap-1">
              <User className="h-3 w-3" />
              {selectedCharacter.name} ({selectedCharacter.class.nomAffich} niv.{" "}
              {selectedCharacter.level})
            </span>
          )}
          {searchQuery && (
            <span className="px-2 py-1 bg-stone-800 rounded-md text-stone-300 truncate max-w-[200px] sm:max-w-none">
              Recherche: "{searchQuery}"
            </span>
          )}
          {!selectedCharacter &&
            selectedClasses.map((c) => (
              <span
                key={c}
                className="px-2 py-1 bg-amber-950 text-amber-300 rounded-md whitespace-nowrap"
              >
                {c}
              </span>
            ))}
          {selectedLevels.map((l) => (
            <span
              key={l}
              className="px-2 py-1 bg-stone-800 text-stone-300 rounded-md whitespace-nowrap"
            >
              {l === 0 ? "Tour de magie" : `Niveau ${l}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
