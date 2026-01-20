import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { CLASSES } from "~/lib/constants";
import { ChevronDown } from "lucide-react";

interface ClassFilterProps {
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
  disabled?: boolean;
}

export function ClassFilter({ selectedClasses, onChange, disabled }: ClassFilterProps) {
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

  const toggleClass = (classId: string) => {
    if (disabled) return;
    if (selectedClasses.includes(classId)) {
      onChange(selectedClasses.filter((c) => c !== classId));
    } else {
      onChange([...selectedClasses, classId]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(CLASSES.map((c) => c.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Find display name for selected class
  const getClassDisplayName = (classId: string) => {
    const cls = CLASSES.find((c) => c.id === classId);
    return cls?.name || classId;
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => !disabled && setOpen(!open)}
        className={`min-w-[140px] justify-between ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
        disabled={disabled}
      >
        <span>
          {disabled && selectedClasses.length === 1
            ? getClassDisplayName(selectedClasses[0])
            : `Classes${selectedClasses.length > 0 ? ` (${selectedClasses.length})` : ""}`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && !disabled && (
        <div className="absolute top-full mt-1 z-50 min-w-[200px] rounded-md border border-stone-700 bg-stone-900 p-2 shadow-lg">
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
            {CLASSES.map((cls) => (
              <Checkbox
                key={cls.id}
                label={cls.name}
                checked={selectedClasses.includes(cls.id)}
                onChange={() => toggleClass(cls.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
