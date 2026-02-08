import type { LoaderFunction } from "react-router";
import { Link, Outlet, useLoaderData } from "react-router";
import { Wand2, Database, Scroll, Skull } from "lucide-react";
import { getSpellCount } from "~/db/queries/spells.server";
import { getMonsterCount } from "~/db/queries/monsters.server";

export const loader: LoaderFunction = async () => {
  const [spellCount, monsterCount] = await Promise.all([
    getSpellCount(),
    getMonsterCount(),
  ]);
  return { spellCount, monsterCount };
};

export default function AdminLayout() {
  const { spellCount, monsterCount } = useLoaderData() as {
    spellCount: number;
    monsterCount: number;
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <header className="border-b border-stone-800 bg-stone-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/admin" className="flex items-center gap-2 font-semibold text-amber-400">
                <Wand2 className="h-5 w-5" />
                <span>Admin D&D</span>
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  to="/admin/spells"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-300 hover:text-amber-200 hover:bg-stone-800/50 transition-colors"
                >
                  <Scroll className="h-4 w-4" />
                  <span>Sorts</span>
                  <span className="text-xs text-stone-500">({spellCount})</span>
                </Link>
                <Link
                  to="/admin/monsters"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-300 hover:text-amber-200 hover:bg-stone-800/50 transition-colors"
                >
                  <Skull className="h-4 w-4" />
                  <span>Monstres</span>
                  <span className="text-xs text-stone-500">({monsterCount})</span>
                </Link>
                <Link
                  to="/update-db"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-300 hover:text-amber-200 hover:bg-stone-800/50 transition-colors"
                >
                  <Database className="h-4 w-4" />
                  <span>Import CSV</span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-stone-400 hover:text-amber-200 transition-colors"
              >
                Voir le site
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
