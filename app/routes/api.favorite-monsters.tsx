import type { Route } from "./+types/api.favorite-monsters";
import { requireAuth } from "~/lib/requireAuth.server";
import { getMonsterById } from "~/db/queries/monsters.server";
import {
  addFavoriteMonster,
  getFavoriteMonsterIds,
  removeFavoriteMonster,
  toggleFavoriteMonster,
} from "~/db/queries/favorite-monsters.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const favoriteMonsterIds = await getFavoriteMonsterIds(user.id);
  return Response.json({ favoriteMonsterIds });
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();

  const monsterIdRaw = formData.get("monsterId");
  const actionType = String(formData.get("action") || "toggle");

  if (!monsterIdRaw) {
    return Response.json({ error: "monsterId is required" }, { status: 400 });
  }

  const monsterId = Number(monsterIdRaw);
  if (!Number.isFinite(monsterId)) {
    return Response.json({ error: "monsterId is invalid" }, { status: 400 });
  }

  const monster = await getMonsterById(monsterId);
  if (!monster) {
    return Response.json({ error: "Monster not found" }, { status: 404 });
  }

  let isFavorite = false;
  switch (actionType) {
    case "add":
      await addFavoriteMonster(user.id, monsterId);
      isFavorite = true;
      break;
    case "remove":
      await removeFavoriteMonster(user.id, monsterId);
      isFavorite = false;
      break;
    case "toggle":
    default:
      isFavorite = await toggleFavoriteMonster(user.id, monsterId);
      break;
  }

  return Response.json({ success: true, isFavorite });
}
