import { useMemo, useState } from "react";
import type { LoaderFunction, ActionFunction } from "react-router";
import { Link } from "react-router";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { deleteMonster, getAllMonstersForAdmin } from "~/db/queries/monsters.server";

export const loader: LoaderFunction = async () => {
  const monsters = await getAllMonstersForAdmin();
  return { monsters };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");
  const monsterId = formData.get("monsterId");

  if (action === "delete" && monsterId) {
    await deleteMonster(Number(monsterId));
    return { success: true };
  }

  return null;
};

export default function AdminMonstersIndex({ loaderData }: { loaderData: { monsters: any[] } }) {
  const { monsters } = loaderData;
  const [search, setSearch] = useState("");

  const filteredMonsters = useMemo(() => {
    if (!search.trim()) return monsters;
    const q = search.toLowerCase();
    return monsters.filter(
      (monster) =>
        monster.name.toLowerCase().includes(q) ||
        monster.type.toLowerCase().includes(q) ||
        (monster.descriptionText || "").toLowerCase().includes(q)
    );
  }, [monsters, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-200">Gestion des monstres</h1>
          <p className="text-stone-400">{monsters.length} monstres au total</p>
        </div>
        <Link to="/admin/monsters/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un monstre
          </Button>
        </Link>
      </div>

      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un monstre..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-300">
            {filteredMonsters.length} monstre{filteredMonsters.length !== 1 ? "s" : ""} trouvé
            {filteredMonsters.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">Nom</th>
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">Type</th>
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">CA</th>
                  <th className="text-left py-3 px-4 text-stone-400 font-medium text-sm">PV</th>
                  <th className="text-right py-3 px-4 text-stone-400 font-medium text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMonsters.map((monster) => (
                  <tr
                    key={monster.id}
                    className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-200 flex items-center gap-2">
                        {monster.imageUrl ? (
                          <img
                            src={monster.imageUrl}
                            alt={monster.name}
                            className="h-8 w-8 rounded object-cover border border-stone-700"
                          />
                        ) : null}
                        {monster.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{monster.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-stone-300">{monster.ac || "-"}</td>
                    <td className="py-3 px-4 text-stone-300">{monster.hp || "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/monsters/${monster.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form method="post" className="inline">
                          <input type="hidden" name="_action" value="delete" />
                          <input type="hidden" name="monsterId" value={monster.id} />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="submit"
                            onClick={(e) => {
                              if (!confirm(`Supprimer "${monster.name}" ?`)) {
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
            {filteredMonsters.length === 0 && (
              <div className="text-center py-8 text-stone-500">Aucun monstre trouvé</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
