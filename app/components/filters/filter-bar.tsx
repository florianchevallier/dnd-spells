import { useSearchParams } from "react-router";
import { ClassFilter } from "./class-filter";
import { LevelFilter } from "./level-filter";
import { SearchInput } from "./search-input";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableLevels?: number[];
}

export function FilterBar({ searchQuery, onSearchChange, availableLevels }: FilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedClasses = searchParams.getAll("class");
  const selectedLevels = searchParams.getAll("level").map(Number);

  const hasFilters =
    selectedClasses.length > 0 || selectedLevels.length > 0 || searchQuery;

  const handleClassChange = (classes: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("class");
    classes.forEach((c) => newParams.append("class", c));
    setSearchParams(newParams);
  };

  const handleLevelChange = (levels: number[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("level");
    levels.forEach((l) => newParams.append("level", l.toString()));
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
          <ClassFilter
            selectedClasses={selectedClasses}
            onChange={handleClassChange}
          />
          <LevelFilter
            selectedLevels={selectedLevels}
            onChange={handleLevelChange}
            availableLevels={availableLevels}
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
          {searchQuery && (
            <span className="px-2 py-1 bg-stone-800 rounded-md text-stone-300 truncate max-w-[200px] sm:max-w-none">
              Recherche: "{searchQuery}"
            </span>
          )}
          {selectedClasses.map((c) => (
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
