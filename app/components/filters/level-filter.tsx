import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { LEVELS } from "~/lib/constants";
import { ChevronDown } from "lucide-react";

interface LevelFilterProps {
  selectedLevels: number[];
  onChange: (levels: number[]) => void;
  availableLevels?: number[];
  disabledLevels?: number[];
}

export function LevelFilter({ selectedLevels, onChange, availableLevels, disabledLevels }: LevelFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLevel = (level: number) => {
    if (selectedLevels.includes(level)) {
      onChange(selectedLevels.filter((l) => l !== level));
    } else {
      onChange([...selectedLevels, level]);
    }
  };

  const selectAll = () => {
    const levelsToSelect = availableLevels 
      ? LEVELS.filter((l) => availableLevels.includes(l.value)).map((l) => l.value)
      : LEVELS.map((l) => l.value);
    onChange(levelsToSelect);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="min-w-[130px] justify-between"
      >
        <span>
          Niveaux
          {selectedLevels.length > 0 && ` (${selectedLevels.length})`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute top-full mt-1 z-50 min-w-[160px] rounded-md border border-stone-700 bg-stone-900 p-2 shadow-lg">
          <div className="flex justify-between mb-2 pb-2 border-b border-stone-700">
            <button
              onClick={selectAll}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Tout
            </button>
            <button
              onClick={clearAll}
              className="text-xs text-stone-400 hover:text-stone-300"
            >
              Aucun
            </button>
          </div>
          <div className="space-y-1">
            {LEVELS.map((level) => {
              const isAvailable = !availableLevels || availableLevels.includes(level.value);
              const isDisabled = disabledLevels?.includes(level.value) || !isAvailable;
              return (
                <Checkbox
                  key={level.value}
                  label={level.label}
                  checked={selectedLevels.includes(level.value)}
                  onChange={() => toggleLevel(level.value)}
                  disabled={isDisabled}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
