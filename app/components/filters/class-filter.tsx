import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { CLASSES } from "~/lib/constants";
import { ChevronDown } from "lucide-react";

interface ClassFilterProps {
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
}

export function ClassFilter({ selectedClasses, onChange }: ClassFilterProps) {
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
    if (selectedClasses.includes(classId)) {
      onChange(selectedClasses.filter((c) => c !== classId));
    } else {
      onChange([...selectedClasses, classId]);
    }
  };

  const selectAll = () => {
    onChange(CLASSES.map((c) => c.id));
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
        className="min-w-[140px] justify-between"
      >
        <span>
          Classes
          {selectedClasses.length > 0 && ` (${selectedClasses.length})`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
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
