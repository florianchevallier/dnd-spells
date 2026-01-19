import { SpellCard } from "./spell-card";
import type { SpellWithClasses } from "~/db/queries/spells";

interface SpellListProps {
  spells: SpellWithClasses[];
  onSpellClick: (spell: SpellWithClasses) => void;
}

export function SpellList({ spells, onSpellClick }: SpellListProps) {
  if (spells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">&#128214;</div>
        <h3 className="text-xl font-semibold text-stone-300 mb-2">
          Aucun sort trouve
        </h3>
        <p className="text-stone-500 max-w-md">
          Essayez de modifier vos filtres ou votre recherche pour trouver des sorts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {spells.map((spell) => (
        <SpellCard
          key={spell.id}
          spell={spell}
          onClick={() => onSpellClick(spell)}
        />
      ))}
    </div>
  );
}
