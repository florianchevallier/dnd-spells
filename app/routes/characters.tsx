import { Outlet, useOutletContext } from "react-router";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import type { Route } from "./+types/characters";
import { getSpellCount } from "~/db/queries/spells.server";
import { getMonsterCount } from "~/db/queries/monsters.server";
import { requireAuth } from "~/lib/requireAuth.server";
import type { User } from "~/db/schema.server";

type ContextType = { user: User };

export async function loader({ request }: Route.LoaderArgs) {
  // Characters routes require authentication
  const user = await requireAuth(request);
  const [spellCount, monsterCount] = await Promise.all([
    getSpellCount(),
    getMonsterCount(),
  ]);
  return { spellCount, monsterCount, user };
}

export default function CharactersLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-950">
      <Header
        spellCount={loaderData.spellCount}
        monsterCount={loaderData.monsterCount}
        user={loaderData.user}
      />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet context={{ user: loaderData.user } satisfies ContextType} />
      </main>
      <Footer />
    </div>
  );
}

export function useUser() {
  return useOutletContext<ContextType>();
}
