import type { LoaderFunction, ActionFunction } from "react-router";
import { Form, useLoaderData, useActionData, useNavigation, redirect } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router";
import {
  getSpellByIdForEdit,
  getAllClasses,
  updateSpell,
  updateSpellClasses,
  createSpell,
} from "~/db/queries/spells.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CLASSES, LEVELS, SCHOOLS } from "~/lib/constants";

export const loader: LoaderFunction = async ({ params }) => {
  const classes = await getAllClasses();

  if (params.id === "new") {
    return { spell: null, classes, isNew: true };
  }

  const spell = await getSpellByIdForEdit(Number(params.id));
  if (!spell) {
    throw new Response("Sort non trouvé", { status: 404 });
  }

  return { spell, classes, isNew: false };
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const isNew = params.id === "new";

  const data = {
    nom: formData.get("nom") as string,
    niveau: Number(formData.get("niveau")),
    ecole: formData.get("ecole") as string,
    rituel: formData.get("rituel") === "on",
    concentration: formData.get("concentration") === "on",
    tempsValeur: formData.get("tempsValeur")
      ? Number(formData.get("tempsValeur"))
      : null,
    tempsUnite: (formData.get("tempsUnite") as string) || null,
    tempsCondition: (formData.get("tempsCondition") as string) || null,
    porteeType: (formData.get("porteeType") as string) || null,
    porteeValeur: formData.get("porteeValeur")
      ? Number(formData.get("porteeValeur"))
      : null,
    porteeUnite: (formData.get("porteeUnite") as string) || null,
    porteeForme: (formData.get("porteeForme") as string) || null,
    dureeType: (formData.get("dureeType") as string) || null,
    dureeValeur: formData.get("dureeValeur")
      ? Number(formData.get("dureeValeur"))
      : null,
    dureeUnite: (formData.get("dureeUnite") as string) || null,
    composantes: (formData.get("composantes") as string) || null,
    materiaux: (formData.get("materiaux") as string) || null,
    niv1: (formData.get("niv1") as string) || null,
    niv2: (formData.get("niv2") as string) || null,
    niv3: (formData.get("niv3") as string) || null,
    niv4: (formData.get("niv4") as string) || null,
    niv5: (formData.get("niv5") as string) || null,
    niv6: (formData.get("niv6") as string) || null,
    niv7: (formData.get("niv7") as string) || null,
    niv8: (formData.get("niv8") as string) || null,
    niv9: (formData.get("niv9") as string) || null,
    source: (formData.get("source") as string) || null,
    description: (formData.get("description") as string) || null,
    niveauxSupTxt: (formData.get("niveauxSupTxt") as string) || null,
  };

  const selectedClassIds = CLASSES.filter((c) => formData.get(`class_${c.id}`) === "on").map(
    (c) => c.id
  );

  const classRows = await getAllClasses();
  const classIdMap = new Map<string, number>();
  for (const c of classRows) {
    classIdMap.set(c.nom, c.id);
  }
  const dbClassIds = selectedClassIds
    .map((nom) => classIdMap.get(nom))
    .filter((id): id is number => id !== undefined);

  if (isNew) {
    const newId = await createSpell(data, dbClassIds);
    return redirect(`/admin/spells/${newId}/edit`);
  } else {
    await updateSpell(Number(params.id), data);
    await updateSpellClasses(Number(params.id), dbClassIds);
    return { success: true };
  }
};

const TIME_UNITS = ["action", "action bonus", "réaction", "minute", "heure", "jour"];
const RANGE_TYPES = ["personnelle", "contact", "courte", "moyenne", "longue", "illimitée"];
const DURATION_TYPES = ["instantanée", "concentration", "speciale"];
const COMPONENTS = ["V", "S", "M"];

export default function AdminSpellEdit() {
  const { spell, classes, isNew } = useLoaderData() as {
    spell: any;
    classes: any[];
    isNew: boolean;
  };
  const actionData = useActionData() as { success?: boolean };
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const defaultSpell = {
    nom: "",
    niveau: 0,
    ecole: "Évocation",
    rituel: false,
    concentration: false,
    tempsValeur: null,
    tempsUnite: "action",
    tempsCondition: null,
    porteeType: "courte",
    porteeValeur: null,
    porteeUnite: null,
    porteeForme: null,
    dureeType: "instantanée",
    dureeValeur: null,
    dureeUnite: null,
    composantes: "",
    materiaux: null,
    niv1: null,
    niv2: null,
    niv3: null,
    niv4: null,
    niv5: null,
    niv6: null,
    niv7: null,
    niv8: null,
    niv9: null,
    source: null,
    description: "",
    niveauxSupTxt: null,
    classes: { ids: [], noms: [], nomsAffich: [] },
  };

  const currentSpell = spell || defaultSpell;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/spells">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-amber-200">
            {isNew ? "Nouveau sort" : `Éditer: ${currentSpell.nom}`}
          </h1>
          <p className="text-stone-400">
            {isNew ? "Créer un nouveau sort" : `ID: ${currentSpell.id}`}
          </p>
        </div>
      </div>

      {actionData?.success && (
        <Card className="bg-green-900/20 border-green-800">
          <CardContent className="pt-6">
            <p className="text-green-400">Modifications enregistrées avec succès!</p>
          </CardContent>
        </Card>
      )}

      <Form method="post" className="space-y-6">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Nom du sort</label>
                <Input
                  name="nom"
                  defaultValue={currentSpell.nom}
                  required
                  placeholder="Nom du sort"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Niveau</label>
                <Select name="niveau" defaultValue={String(currentSpell.niveau)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level.value} value={String(level.value)}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">École de magie</label>
                <Select name="ecole" defaultValue={currentSpell.ecole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SCHOOLS).map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Source</label>
                <Input
                  name="source"
                  defaultValue={currentSpell.source || ""}
                  placeholder="PHB, XGE, etc."
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <Checkbox name="rituel" defaultChecked={currentSpell.rituel} />
                <span className="text-sm text-stone-300">Rituel</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox name="concentration" defaultChecked={currentSpell.concentration} />
                <span className="text-sm text-stone-300">Concentration</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Temps d'incantation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Valeur</label>
                <Input
                  name="tempsValeur"
                  type="number"
                  defaultValue={currentSpell.tempsValeur || ""}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Unité</label>
                <Select name="tempsUnite" defaultValue={currentSpell.tempsUnite || "action"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Condition</label>
                <Input
                  name="tempsCondition"
                  defaultValue={currentSpell.tempsCondition || ""}
                  placeholder="Optionnel"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Portée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Type</label>
                <Select name="porteeType" defaultValue={currentSpell.porteeType || "courte"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Valeur</label>
                <Input
                  name="porteeValeur"
                  type="number"
                  defaultValue={currentSpell.porteeValeur || ""}
                  placeholder="9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Unité</label>
                <Input
                  name="porteeUnite"
                  defaultValue={currentSpell.porteeUnite || ""}
                  placeholder="mètres"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-300">Forme (optionnel)</label>
              <Input
                name="porteeForme"
                defaultValue={currentSpell.porteeForme || ""}
                placeholder="sphère de 3 mètres de rayon, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Durée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Type</label>
                <Select name="dureeType" defaultValue={currentSpell.dureeType || "instantanée"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Valeur</label>
                <Input
                  name="dureeValeur"
                  type="number"
                  defaultValue={currentSpell.dureeValeur || ""}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-300">Unité</label>
                <Input
                  name="dureeUnite"
                  defaultValue={currentSpell.dureeUnite || ""}
                  placeholder="minute, heure"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Composantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {COMPONENTS.map((comp) => (
                <label key={comp} className="flex items-center gap-2">
                  <Checkbox
                    name="composantes"
                    value={comp}
                    defaultChecked={currentSpell.composantes?.includes(comp)}
                  />
                  <span className="text-sm text-stone-300">{comp}</span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-300">Matériaux (optionnel)</label>
              <Textarea
                name="materiaux"
                defaultValue={currentSpell.materiaux || ""}
                placeholder="Composants matériels nécessaires..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Classes</CardTitle>
            <CardDescription>Sélectionnez les classes qui peuvent lancer ce sort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {CLASSES.map((cls) => (
                <label key={cls.id} className="flex items-center gap-2">
                  <Checkbox
                    name={`class_${cls.id}`}
                    defaultChecked={currentSpell.classes.noms?.includes(cls.id)}
                  />
                  <span className="text-sm text-stone-300">{cls.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-300">Description</label>
              <Textarea
                name="description"
                defaultValue={currentSpell.description || ""}
                placeholder="Description du sort..."
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-300">Niveaux supérieurs</label>
              <Textarea
                name="niveauxSupTxt"
                defaultValue={currentSpell.niveauxSupTxt || ""}
                placeholder="Effets aux niveaux supérieurs..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-200">Scaling par niveau</CardTitle>
            <CardDescription>Description de l'effet aux niveaux 2-9</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                <div key={level} className="space-y-2">
                  <label className="text-sm font-medium text-stone-300">Niveau {level}</label>
                  <Input
                    name={`niv${level}`}
                    defaultValue={currentSpell[`niv${level}`] || ""}
                    placeholder={`Effet au niveau ${level}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link to="/admin/spells">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
