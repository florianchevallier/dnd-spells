import { Link } from "react-router";
import { BookOpen } from "lucide-react";

interface HeaderProps {
  spellCount?: number;
}

export function Header({ spellCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/95 backdrop-blur supports-[backdrop-filter]:bg-stone-950/80">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/spells" className="flex items-center gap-2 sm:gap-3 group">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-900/30 border border-amber-800/50 group-hover:bg-amber-900/50 transition-colors">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
                Grimoire D&D 5e
              </h1>
              {spellCount !== undefined && (
                <p className="text-xs text-stone-500 hidden xs:block">
                  {spellCount} sorts disponibles
                </p>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
