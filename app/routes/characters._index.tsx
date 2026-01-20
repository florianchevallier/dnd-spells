import { Link } from "react-router";
import type { Route } from "./+types/characters._index";
import { getCharactersByUserId } from "~/db/queries/characters";
import { requireAuth } from "~/lib/requireAuth.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Plus, Edit, Trash2, User as UserIcon } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const characters = await getCharactersByUserId(user.id);
  return { characters };
}

export function meta() {
  return [
    { title: "Mes personnages - Grimoire D&D 5e" },
    { name: "description", content: "Gerez vos personnages D&D" },
  ];
}

export default function CharactersIndex({ loaderData }: Route.ComponentProps) {
  const { characters } = loaderData;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-200">Mes personnages</h1>
          <p className="text-stone-400 text-sm sm:text-base">
            Creez et gerez vos personnages pour filtrer les sorts
          </p>
        </div>
        <Link to="/characters/new" className="w-full sm:w-auto">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nouveau personnage
          </Button>
        </Link>
      </div>

      {characters.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6 pb-6 text-center px-4">
            <UserIcon className="h-12 w-12 mx-auto text-stone-600 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-stone-300 mb-2">
              Aucun personnage
            </h3>
            <p className="text-sm sm:text-base text-stone-400 mb-4">
              Creez votre premier personnage pour commencer a filtrer les sorts selon ses capacites.
            </p>
            <Link to="/characters/new" className="inline-block w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Creer un personnage
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {characters.map((character) => (
            <Card
              key={character.id}
              className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg text-amber-200 break-words">
                      {character.name}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {character.class.nomAffich} niveau {character.level}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Link to={`/characters/${character.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </Link>
                    <Link to={`/characters/${character.id}/delete`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-400 hover:text-red-300 hover:bg-red-950"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {character.subclass && (
                  <p className="text-xs sm:text-sm text-stone-400 mb-2">
                    {character.subclass.nomAffich}
                  </p>
                )}
                <Link
                  to={`/?character=${character.id}`}
                  className="inline-block text-xs sm:text-sm text-amber-400 hover:text-amber-300"
                >
                  Voir les sorts disponibles →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
