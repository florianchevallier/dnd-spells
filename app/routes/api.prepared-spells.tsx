import type { Route } from "./+types/api.prepared-spells";
import { requireAuth } from "~/lib/requireAuth.server";
import { getCharacterById } from "~/db/queries/characters.server";
import {
  addPreparedSpell,
  removePreparedSpell,
  togglePreparedSpell,
  getPreparedSpellIds,
} from "~/db/queries/prepared-spells.server";

// GET: Get prepared spell IDs for a character
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const characterId = url.searchParams.get("characterId");

  if (!characterId) {
    return Response.json({ error: "characterId is required" }, { status: 400 });
  }

  // Verify character belongs to user
  const character = await getCharacterById(Number(characterId), user.id);
  if (!character) {
    return Response.json({ error: "Character not found" }, { status: 404 });
  }

  const preparedSpellIds = await getPreparedSpellIds(character.id);
  return Response.json({ preparedSpellIds });
}

// POST: Add or toggle a prepared spell
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();

  const characterId = formData.get("characterId");
  const spellId = formData.get("spellId");
  const actionType = formData.get("action") || "toggle"; // toggle, add, remove

  if (!characterId || !spellId) {
    return Response.json(
      { error: "characterId and spellId are required" },
      { status: 400 }
    );
  }

  // Verify character belongs to user
  const character = await getCharacterById(Number(characterId), user.id);
  if (!character) {
    return Response.json({ error: "Character not found" }, { status: 404 });
  }

  let isPrepared: boolean;

  switch (actionType) {
    case "add":
      await addPreparedSpell(character.id, Number(spellId));
      isPrepared = true;
      break;
    case "remove":
      await removePreparedSpell(character.id, Number(spellId));
      isPrepared = false;
      break;
    case "toggle":
    default:
      isPrepared = await togglePreparedSpell(character.id, Number(spellId));
      break;
  }

  return Response.json({ success: true, isPrepared });
}
