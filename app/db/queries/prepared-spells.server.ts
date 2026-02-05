import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "../index.server";
import type { SpellWithClasses } from "./spells.server";

// Get all prepared spell IDs for a character
export async function getPreparedSpellIds(characterId: number): Promise<number[]> {
  const result = await db
    .select({ spellId: schema.characterPreparedSpells.spellId })
    .from(schema.characterPreparedSpells)
    .where(eq(schema.characterPreparedSpells.characterId, characterId));

  return result.map((row) => row.spellId);
}

// Get prepared spells with full details for a character
export async function getPreparedSpellsByCharacter(
  characterId: number
): Promise<SpellWithClasses[]> {
  // Get prepared spell IDs
  const preparedRows = await db
    .select({ spellId: schema.characterPreparedSpells.spellId })
    .from(schema.characterPreparedSpells)
    .where(eq(schema.characterPreparedSpells.characterId, characterId));

  if (preparedRows.length === 0) return [];

  const spellIds = preparedRows.map((row) => row.spellId);

  // Get full spell details
  const spellsResult = await db
    .select()
    .from(schema.spells)
    .where(inArray(schema.spells.id, spellIds))
    .orderBy(schema.spells.niveau, schema.spells.nom);

  if (spellsResult.length === 0) return [];

  // Get classes for each spell
  const spellClassesResult = await db
    .select({
      spellId: schema.spellClasses.spellId,
      className: schema.classes.nomAffich,
    })
    .from(schema.spellClasses)
    .innerJoin(
      schema.classes,
      eq(schema.spellClasses.classId, schema.classes.id)
    )
    .where(inArray(schema.spellClasses.spellId, spellIds));

  // Group classes by spell
  const classesMap = new Map<number, string[]>();
  for (const row of spellClassesResult) {
    if (!classesMap.has(row.spellId)) {
      classesMap.set(row.spellId, []);
    }
    classesMap.get(row.spellId)!.push(row.className);
  }

  return spellsResult.map((spell) => ({
    ...spell,
    classes: classesMap.get(spell.id) || [],
  }));
}

// Check if a spell is prepared by a character
export async function isSpellPrepared(
  characterId: number,
  spellId: number
): Promise<boolean> {
  const result = await db
    .select({ id: schema.characterPreparedSpells.id })
    .from(schema.characterPreparedSpells)
    .where(
      and(
        eq(schema.characterPreparedSpells.characterId, characterId),
        eq(schema.characterPreparedSpells.spellId, spellId)
      )
    )
    .limit(1);

  return result.length > 0;
}

// Add a prepared spell
export async function addPreparedSpell(
  characterId: number,
  spellId: number
): Promise<void> {
  // Check if already prepared
  const alreadyPrepared = await isSpellPrepared(characterId, spellId);
  if (alreadyPrepared) return;

  await db.insert(schema.characterPreparedSpells).values({
    characterId,
    spellId,
  });
}

// Remove a prepared spell
export async function removePreparedSpell(
  characterId: number,
  spellId: number
): Promise<void> {
  await db
    .delete(schema.characterPreparedSpells)
    .where(
      and(
        eq(schema.characterPreparedSpells.characterId, characterId),
        eq(schema.characterPreparedSpells.spellId, spellId)
      )
    );
}

// Toggle prepared spell (add if not prepared, remove if prepared)
export async function togglePreparedSpell(
  characterId: number,
  spellId: number
): Promise<boolean> {
  const isPrepared = await isSpellPrepared(characterId, spellId);

  if (isPrepared) {
    await removePreparedSpell(characterId, spellId);
    return false;
  } else {
    await addPreparedSpell(characterId, spellId);
    return true;
  }
}

// Get count of prepared spells for a character
export async function getPreparedSpellCount(characterId: number): Promise<number> {
  const result = await db
    .select({ spellId: schema.characterPreparedSpells.spellId })
    .from(schema.characterPreparedSpells)
    .where(eq(schema.characterPreparedSpells.characterId, characterId));

  return result.length;
}
