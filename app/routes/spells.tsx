import { Outlet } from "react-router";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import type { Route } from "./+types/spells";
import { getSpellCount } from "~/db/queries/spells";

export async function loader({}: Route.LoaderArgs) {
  const count = await getSpellCount();
  return { spellCount: count };
}

export default function SpellsLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-950">
      <Header spellCount={loaderData.spellCount} />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
