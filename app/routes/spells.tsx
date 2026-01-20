import { Outlet } from "react-router";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import type { Route } from "./+types/spells";
import type { getSpellCount } from "~/db/queries/spells.server";
import { getOptionalUser } from "~/lib/requireAuth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [count, user] = await Promise.all([
    getSpellCount(),
    getOptionalUser(request),
  ]);
  return { spellCount: count, user };
}

export default function SpellsLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-stone-950">
      <Header spellCount={loaderData.spellCount} user={loaderData.user} />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
