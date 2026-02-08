import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "../index.server";
import { mapMonsterRow, type MonsterWithContent } from "./monsters.server";

export async function getFavoriteMonsterIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ monsterId: schema.userFavoriteMonsters.monsterId })
    .from(schema.userFavoriteMonsters)
    .where(eq(schema.userFavoriteMonsters.userId, userId));
  return rows.map((row) => row.monsterId);
}

export async function isMonsterFavorite(userId: number, monsterId: number): Promise<boolean> {
  const rows = await db
    .select({ id: schema.userFavoriteMonsters.id })
    .from(schema.userFavoriteMonsters)
    .where(
      and(
        eq(schema.userFavoriteMonsters.userId, userId),
        eq(schema.userFavoriteMonsters.monsterId, monsterId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function addFavoriteMonster(userId: number, monsterId: number): Promise<void> {
  const existing = await isMonsterFavorite(userId, monsterId);
  if (existing) return;
  await db.insert(schema.userFavoriteMonsters).values({ userId, monsterId });
}

export async function removeFavoriteMonster(userId: number, monsterId: number): Promise<void> {
  await db
    .delete(schema.userFavoriteMonsters)
    .where(
      and(
        eq(schema.userFavoriteMonsters.userId, userId),
        eq(schema.userFavoriteMonsters.monsterId, monsterId)
      )
    );
}

export async function toggleFavoriteMonster(userId: number, monsterId: number): Promise<boolean> {
  const isFavorite = await isMonsterFavorite(userId, monsterId);
  if (isFavorite) {
    await removeFavoriteMonster(userId, monsterId);
    return false;
  }
  await addFavoriteMonster(userId, monsterId);
  return true;
}

export async function getFavoriteMonstersByUser(userId: number): Promise<MonsterWithContent[]> {
  const favoriteRows = await db
    .select({ monsterId: schema.userFavoriteMonsters.monsterId })
    .from(schema.userFavoriteMonsters)
    .where(eq(schema.userFavoriteMonsters.userId, userId));

  if (favoriteRows.length === 0) return [];
  const monsterIds = favoriteRows.map((row) => row.monsterId);

  const monsters = await db
    .select()
    .from(schema.monsters)
    .where(inArray(schema.monsters.id, monsterIds))
    .orderBy(schema.monsters.name);

  return monsters.map(mapMonsterRow);
}
