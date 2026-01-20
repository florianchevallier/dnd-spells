import { redirect, data } from "react-router";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/characters.new";
import { requireAuth } from "~/lib/requireAuth.server";
import {
  createCharacter,
  getAllClassesForCharacter,
  getSubclassesByClassId,
} from "~/db/queries/characters.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const classes = await getAllClassesForCharacter();

  // Get subclasses for first class by default
  const firstClass = classes[0];
  const subclasses = firstClass
    ? await getSubclassesByClassId(firstClass.id)
    : [];

  return { user, classes, initialSubclasses: subclasses };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const classId = Number(formData.get("classId"));
  const subclassIdValue = formData.get("subclassId") as string;
  const subclassId = subclassIdValue && subclassIdValue !== "none"
    ? Number(subclassIdValue)
    : null;
  const level = Number(formData.get("level"));

  // Validation
  if (!name || name.trim().length === 0) {
    return data({ error: "Le nom est requis" }, { status: 400 });
  }

  if (!classId) {
    return data({ error: "La classe est requise" }, { status: 400 });
  }

  if (level < 1 || level > 20) {
    return data({ error: "Le niveau doit etre entre 1 et 20" }, { status: 400 });
  }

  await createCharacter({
    userId: user.id,
    name: name.trim(),
    classId,
    subclassId,
    level,
  });

  return redirect("/characters");
}

export function meta() {
  return [
    { title: "Nouveau personnage - Grimoire D&D 5e" },
    { name: "description", content: "Creez un nouveau personnage D&D" },
  ];
}

export default function CharacterNew() {
  const { classes, initialSubclasses } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id.toString() || ""
  );
  const [subclasses, setSubclasses] = useState(initialSubclasses);
  const [loadingSubclasses, setLoadingSubclasses] = useState(false);

  // Fetch subclasses when class changes
  useEffect(() => {
    if (selectedClassId) {
      setLoadingSubclasses(true);
      fetch(`/api/subclasses?classId=${selectedClassId}`)
        .then((res) => res.json())
        .then((data) => {
          setSubclasses(data.subclasses);
          setLoadingSubclasses(false);
        })
        .catch(() => {
          setSubclasses([]);
          setLoadingSubclasses(false);
        });
    }
  }, [selectedClassId]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/characters">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-amber-200">Nouveau personnage</h1>
          <p className="text-stone-400 text-sm sm:text-base">Creez un nouveau personnage D&D</p>
        </div>
      </div>

      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-amber-200">
            Informations du personnage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            {actionData?.error && (
              <div className="bg-red-900/20 border border-red-800 rounded-md p-3">
                <p className="text-red-400 text-sm">{actionData.error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-stone-300">
                Nom du personnage
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Aragorn, Gandalf..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="classId" className="text-sm font-medium text-stone-300">
                  Classe
                </label>
                <Select
                  name="classId"
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.nomAffich}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="level" className="text-sm font-medium text-stone-300">
                  Niveau
                </label>
                <Input
                  id="level"
                  name="level"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subclassId" className="text-sm font-medium text-stone-300">
                Sous-classe (optionnel)
              </label>
              <Select
                name="subclassId"
                defaultValue="none"
                disabled={loadingSubclasses || subclasses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingSubclasses
                        ? "Chargement..."
                        : subclasses.length === 0
                          ? "Aucune sous-classe disponible"
                          : "Choisir une sous-classe"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {subclasses.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>
                      {sub.nomAffich}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <Link to="/characters" className="w-full sm:w-auto">
                <Button variant="outline" type="button" className="w-full sm:w-auto">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creation..." : "Creer le personnage"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
