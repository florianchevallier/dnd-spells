import { redirect } from "react-router";
import { Form, useLoaderData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/characters.$id.delete";
import { requireAuth } from "~/lib/requireAuth.server";
import { getCharacterById, deleteCharacter } from "~/db/queries/characters";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const characterId = Number(params.id);

  const character = await getCharacterById(characterId, user.id);
  if (!character) {
    throw new Response("Personnage non trouve", { status: 404 });
  }

  return { character };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const characterId = Number(params.id);

  await deleteCharacter(characterId, user.id);

  return redirect("/characters");
}

export function meta({ data }: Route.MetaArgs) {
  const character = data?.character;
  return [
    { title: character ? `Supprimer ${character.name} - Grimoire D&D 5e` : "Supprimer personnage" },
  ];
}

export default function CharacterDelete() {
  const { character } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-md mx-auto space-y-6 px-4 md:px-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/characters">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-amber-200">
            Supprimer le personnage
          </h1>
        </div>
      </div>

      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <CardTitle className="text-base sm:text-lg text-stone-200 px-2">
            Etes-vous sur de vouloir supprimer ce personnage?
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-stone-400 px-2">
            Cette action est irreversible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-stone-800/50 rounded-md p-3 sm:p-4 text-center">
            <p className="text-base sm:text-lg font-medium text-amber-200 break-words">{character.name}</p>
            <p className="text-stone-400 text-sm sm:text-base">
              {character.class.nomAffich} niveau {character.level}
            </p>
            {character.subclass && (
              <p className="text-xs sm:text-sm text-stone-500">{character.subclass.nomAffich}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Link to="/characters" className="flex-1">
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </Link>
            <Form method="post" className="flex-1">
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isSubmitting ? "Suppression..." : "Supprimer"}
              </Button>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
