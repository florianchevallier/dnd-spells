import { Link } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { getAllSpellsForAdmin, deleteSpell } from "~/db/queries/spells.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getSchoolColor, getLevelLabel, SCHOOLS, LEVELS } from "~/lib/constants";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const levelFilter = url.searchParams.get("level") || "all";
  const schoolFilter = url.searchParams.get("school") || "all";

  const spells = await getAllSpellsForAdmin();

  return { spells, search, levelFilter, schoolFilter };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");
  const spellId = formData.get("spellId");

  if (action === "delete" && spellId) {
    await deleteSpell(Number(spellId));
    return { success: true };
  }

  return null;
};

export default function AdminSpellsIndex({ loaderData }: { loaderData: any }) {
  const { spells, search, levelFilter, schoolFilter } = loaderData;

  const filteredSpells = spells.filter((spell: any) => {
    const matchesSearch =
      !search ||
      spell.nom.toLowerCase().includes(search.toLowerCase()) ||
      (spell.description && spell.description.toLowerCase().includes(search.toLowerCase()));
    const matchesLevel = levelFilter === "all" || spell.niveau === Number(levelFilter);
    const matchesSchool = schoolFilter === "all" || spell.ecole === schoolFilter;
    return matchesSearch && matchesLevel && matchesSchool;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-200">Gestion des sorts</h1>
          <p className="text-stone-400">{spells.length} sorts au total</p>
        </div>
        <Link to="/admin/spells/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un sort
          </Button>
        </Link>
      </div>

      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  name="search"
                  placeholder="Rechercher un sort..."
                  defaultValue={search}
                  className="pl-9"
                />
              </div>
            </div>
            <Select name="level" defaultValue={levelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {LEVELS.map((level) => (
                  <SelectItem key={level.value} value={String(level.value)}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="school" defaultValue={schoolFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="École" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les écoles</SelectItem>
                {Object.keys(SCHOOLS).map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-300">
            {filteredSpells.length} sort{filteredSpells.length !== 1 ? "s" : ""} trouvé
            {filteredSpells.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">Nom</th>
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">Niveau</th>
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">École</th>
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">Classes</th>
                  <th className="text-right py-3 px-4 text-stone-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpells.map((spell: any) => (
                  <tr
                    key={spell.id}
                    className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-200">{spell.nom}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getSchoolColor(spell.ecole)}>
                        {getLevelLabel(spell.niveau)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{spell.ecole}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {spell.classes.nomsAffich?.slice(0, 3).map((name: string) => (
                          <Badge key={name} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                        {spell.classes.nomsAffich?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{spell.classes.nomsAffich.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/spells/${spell.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form method="post" className="inline">
                          <input type="hidden" name="_action" value="delete" />
                          <input type="hidden" name="spellId" value={spell.id} />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="submit"
                            onClick={(e) => {
                              if (!confirm(`Supprimer "${spell.nom}" ?`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSpells.length === 0 && (
              <div className="text-center py-8 text-stone-500">
                Aucun sort trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
