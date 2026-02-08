import { Outlet } from "react-router";
import type { Route } from "./+types/monsters";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import { getSpellCount } from "~/db/queries/spells.server";
import { getMonsterCount } from "~/db/queries/monsters.server";
import { getOptionalUser } from "~/lib/requireAuth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [spellCount, monsterCount, user] = await Promise.all([
    getSpellCount(),
    getMonsterCount(),
    getOptionalUser(request),
  ]);
  return { spellCount, monsterCount, user };
}

export default function MonstersLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-950">
      <Header
        spellCount={loaderData.spellCount}
        monsterCount={loaderData.monsterCount}
        user={loaderData.user}
      />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
