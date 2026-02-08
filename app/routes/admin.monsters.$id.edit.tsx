import type { ActionFunction, LoaderFunction } from "react-router";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  createMonster,
  getMonsterByIdForEdit,
  updateMonster,
  type MonsterMutationData,
} from "~/db/queries/monsters.server";

function parseNullableInt(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function parseJsonOrThrow(value: FormDataEntryValue | null, fallback: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return JSON.stringify(fallback);
  const parsed = JSON.parse(raw);
  return JSON.stringify(parsed);
}

export const loader: LoaderFunction = async ({ params }) => {
  if (params.id === "new") {
    return { isNew: true, monster: null };
  }

  const monster = await getMonsterByIdForEdit(Number(params.id));
  if (!monster) {
    throw new Response("Monstre non trouvé", { status: 404 });
  }

  return { isNew: false, monster };
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const isNew = params.id === "new";

  try {
    const payload: MonsterMutationData = {
      name: String(formData.get("name") || "").trim(),
      type: String(formData.get("type") || "").trim(),
      tradRaw: String(formData.get("tradRaw") || "").trim() || null,
      tradJson: parseJsonOrThrow(formData.get("tradJson"), []),
      ac: String(formData.get("ac") || "").trim() || null,
      hp: String(formData.get("hp") || "").trim() || null,
      speed: String(formData.get("speed") || "").trim() || null,
      str: parseNullableInt(formData.get("str")),
      dex: parseNullableInt(formData.get("dex")),
      con: parseNullableInt(formData.get("con")),
      int: parseNullableInt(formData.get("int")),
      wis: parseNullableInt(formData.get("wis")),
      cha: parseNullableInt(formData.get("cha")),
      strMod: String(formData.get("strMod") || "").trim() || null,
      dexMod: String(formData.get("dexMod") || "").trim() || null,
      conMod: String(formData.get("conMod") || "").trim() || null,
      intMod: String(formData.get("intMod") || "").trim() || null,
      wisMod: String(formData.get("wisMod") || "").trim() || null,
      chaMod: String(formData.get("chaMod") || "").trim() || null,
      detailsJson: parseJsonOrThrow(formData.get("detailsJson"), {}),
      sectionsJson: parseJsonOrThrow(formData.get("sectionsJson"), []),
      descriptionText: String(formData.get("descriptionText") || "").trim() || null,
      imageUrl: String(formData.get("imageUrl") || "").trim() || null,
      linksJson: parseJsonOrThrow(formData.get("linksJson"), []),
    };

    if (!payload.name || !payload.type) {
      return { error: "Le nom et le type sont obligatoires." };
    }

    if (isNew) {
      const id = await createMonster(payload);
      return redirect(`/admin/monsters/${id}/edit`);
    }

    await updateMonster(Number(params.id), payload);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Erreur de validation: ${error.message}`
          : "Erreur de validation des données.",
    };
  }
};

export default function AdminMonsterEdit() {
  const { monster, isNew } = useLoaderData() as { monster: any; isNew: boolean };
  const actionData = useActionData() as { success?: boolean; error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const currentMonster = monster || {
    name: "",
    type: "",
    tradRaw: "",
    tradJson: "[]",
    ac: "",
    hp: "",
    speed: "",
    str: "",
    dex: "",
    con: "",
    int: "",
    wis: "",
    cha: "",
    strMod: "",
    dexMod: "",
    conMod: "",
    intMod: "",
    wisMod: "",
    chaMod: "",
    detailsJson: "{}",
    sectionsJson: "[]",
    descriptionText: "",
    imageUrl: "",
    linksJson: "[]",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/monsters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-amber-200">
            {isNew ? "Nouveau monstre" : `Éditer: ${currentMonster.name}`}
          </h1>
          {!isNew && <p className="text-stone-400">ID: {currentMonster.id}</p>}
        </div>
      </div>

      {actionData?.success && (
        <Card className="bg-green-900/20 border-green-800">
          <CardContent className="pt-6 text-green-400">
            Modifications enregistrées avec succès.
          </CardContent>
        </Card>
      )}
      {actionData?.error && (
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="pt-6 text-red-400">{actionData.error}</CardContent>
        </Card>
      )}

      <Form method="post" className="space-y-6">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-stone-300">Nom</label>
              <Input name="name" defaultValue={currentMonster.name} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">Type</label>
              <Input name="type" defaultValue={currentMonster.type} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">AC</label>
              <Input name="ac" defaultValue={currentMonster.ac || ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">HP</label>
              <Input name="hp" defaultValue={currentMonster.hp || ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">Vitesse</label>
              <Input name="speed" defaultValue={currentMonster.speed || ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">Image URL</label>
              <Input name="imageUrl" defaultValue={currentMonster.imageUrl || ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-stone-300">Traductions (brut)</label>
              <Input name="tradRaw" defaultValue={currentMonster.tradRaw || ""} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              ["str", "FOR"],
              ["dex", "DEX"],
              ["con", "CON"],
              ["int", "INT"],
              ["wis", "SAG"],
              ["cha", "CHA"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm text-stone-300">{label}</label>
                <Input name={key} defaultValue={currentMonster[key] ?? ""} type="number" />
              </div>
            ))}
            {[
              ["strMod", "Mod FOR"],
              ["dexMod", "Mod DEX"],
              ["conMod", "Mod CON"],
              ["intMod", "Mod INT"],
              ["wisMod", "Mod SAG"],
              ["chaMod", "Mod CHA"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm text-stone-300">{label}</label>
                <Input name={key} defaultValue={currentMonster[key] ?? ""} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="descriptionText"
              defaultValue={currentMonster.descriptionText || ""}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-amber-200">JSON avancé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-stone-300">trad_json</label>
              <Textarea
                name="tradJson"
                defaultValue={currentMonster.tradJson || "[]"}
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">details_json</label>
              <Textarea
                name="detailsJson"
                defaultValue={currentMonster.detailsJson || "{}"}
                rows={8}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">sections_json</label>
              <Textarea
                name="sectionsJson"
                defaultValue={currentMonster.sectionsJson || "[]"}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-300">links_json</label>
              <Textarea
                name="linksJson"
                defaultValue={currentMonster.linksJson || "[]"}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
