import { eq, and, desc } from "drizzle-orm";
import { db } from "~/db";
import {
  characters,
  classes,
  subclasses,
  classSpellSlots,
  type Character,
  type NewCharacter,
} from "~/db/schema";

// Character with class and subclass info
export interface CharacterWithDetails {
  id: number;
  name: string;
  level: number;
  userId: number;
  classId: number;
  subclassId: number | null;
  createdAt: Date;
  updatedAt: Date;
  class: {
    id: number;
    nom: string;
    nomAffich: string;
  };
  subclass: {
    id: number;
    nom: string;
    nomAffich: string;
  } | null;
}

// Get all characters for a user
export async function getCharactersByUserId(
  userId: number
): Promise<CharacterWithDetails[]> {
  const result = await db
    .select({
      id: characters.id,
      name: characters.name,
      level: characters.level,
      userId: characters.userId,
      classId: characters.classId,
      subclassId: characters.subclassId,
      createdAt: characters.createdAt,
      updatedAt: characters.updatedAt,
      class: {
        id: classes.id,
        nom: classes.nom,
        nomAffich: classes.nomAffich,
      },
      subclass: {
        id: subclasses.id,
        nom: subclasses.nom,
        nomAffich: subclasses.nomAffich,
      },
    })
    .from(characters)
    .leftJoin(classes, eq(characters.classId, classes.id))
    .leftJoin(subclasses, eq(characters.subclassId, subclasses.id))
    .where(eq(characters.userId, userId))
    .orderBy(desc(characters.updatedAt));

  return result.map((row) => ({
    ...row,
    class: row.class!,
    subclass: row.subclass?.id ? row.subclass : null,
  }));
}

// Get a single character by ID (with ownership check)
export async function getCharacterById(
  id: number,
  userId: number
): Promise<CharacterWithDetails | null> {
  const [result] = await db
    .select({
      id: characters.id,
      name: characters.name,
      level: characters.level,
      userId: characters.userId,
      classId: characters.classId,
      subclassId: characters.subclassId,
      createdAt: characters.createdAt,
      updatedAt: characters.updatedAt,
      class: {
        id: classes.id,
        nom: classes.nom,
        nomAffich: classes.nomAffich,
      },
      subclass: {
        id: subclasses.id,
        nom: subclasses.nom,
        nomAffich: subclasses.nomAffich,
      },
    })
    .from(characters)
    .leftJoin(classes, eq(characters.classId, classes.id))
    .leftJoin(subclasses, eq(characters.subclassId, subclasses.id))
    .where(and(eq(characters.id, id), eq(characters.userId, userId)));

  if (!result) return null;

  return {
    ...result,
    class: result.class!,
    subclass: result.subclass?.id ? result.subclass : null,
  };
}

// Create a new character
export async function createCharacter(
  data: Omit<NewCharacter, "id" | "createdAt" | "updatedAt">
): Promise<number> {
  const result = await db.insert(characters).values(data);
  // Get the inserted ID
  const [newChar] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(
      and(
        eq(characters.userId, data.userId),
        eq(characters.name, data.name),
        eq(characters.classId, data.classId)
      )
    )
    .orderBy(desc(characters.id))
    .limit(1);

  return newChar.id;
}

// Update a character
export async function updateCharacter(
  id: number,
  userId: number,
  data: Partial<Pick<Character, "name" | "classId" | "subclassId" | "level">>
): Promise<void> {
  await db
    .update(characters)
    .set(data)
    .where(and(eq(characters.id, id), eq(characters.userId, userId)));
}

// Delete a character
export async function deleteCharacter(
  id: number,
  userId: number
): Promise<void> {
  await db
    .delete(characters)
    .where(and(eq(characters.id, id), eq(characters.userId, userId)));
}

// Get all classes (for character creation form)
export async function getAllClassesForCharacter() {
  return db.select().from(classes).orderBy(classes.nomAffich);
}

// Get subclasses for a specific class
export async function getSubclassesByClassId(classId: number) {
  return db
    .select()
    .from(subclasses)
    .where(eq(subclasses.classId, classId))
    .orderBy(subclasses.nomAffich);
}

// Get spell slots for a character based on class, subclass, and level
export async function getSpellSlotsForCharacter(
  classId: number,
  subclassId: number | null,
  level: number
) {
  // First try to find specific subclass spell slots
  if (subclassId) {
    const [subclassSlots] = await db
      .select()
      .from(classSpellSlots)
      .where(
        and(
          eq(classSpellSlots.classId, classId),
          eq(classSpellSlots.subclassId, subclassId),
          eq(classSpellSlots.characterLevel, level)
        )
      );

    if (subclassSlots) {
      return subclassSlots;
    }
  }

  // Fall back to any subclass of the same class (they usually have the same spell progression)
  const [classSlots] = await db
    .select()
    .from(classSpellSlots)
    .where(
      and(
        eq(classSpellSlots.classId, classId),
        eq(classSpellSlots.characterLevel, level)
      )
    )
    .limit(1);

  return classSlots || null;
}

// Get available spell levels for a character
export function getAvailableSpellLevelsFromSlots(slots: {
  slotLevel1: number;
  slotLevel2: number;
  slotLevel3: number;
  slotLevel4: number;
  slotLevel5: number;
  slotLevel6: number;
  slotLevel7: number;
  slotLevel8: number;
  slotLevel9: number;
}): number[] {
  const levels: number[] = [0]; // Cantrips are always available

  if (slots.slotLevel1 > 0) levels.push(1);
  if (slots.slotLevel2 > 0) levels.push(2);
  if (slots.slotLevel3 > 0) levels.push(3);
  if (slots.slotLevel4 > 0) levels.push(4);
  if (slots.slotLevel5 > 0) levels.push(5);
  if (slots.slotLevel6 > 0) levels.push(6);
  if (slots.slotLevel7 > 0) levels.push(7);
  if (slots.slotLevel8 > 0) levels.push(8);
  if (slots.slotLevel9 > 0) levels.push(9);

  return levels;
}
