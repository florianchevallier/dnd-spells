import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { db, schema } from "../index.server";

export interface MonsterFilters {
  search?: string;
  types?: string[];
}

export interface MonsterDetailEntry {
  label: string;
  value: string;
}

export interface MonsterSectionEntry {
  kind: string;
  name: string;
  text: string;
}

export interface MonsterSection {
  title: string;
  entries: MonsterSectionEntry[];
}

export interface MonsterLink {
  href: string;
  text: string;
}

export interface MonsterWithContent extends schema.Monster {
  trad: string[];
  details: Record<string, string>;
  sections: MonsterSection[];
  links: MonsterLink[];
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function toRecordOfString(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    out[String(k)] = String(v ?? "");
  }
  return out;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "")).filter(Boolean);
}

function toLinks(value: unknown): MonsterLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const link = item as { href?: unknown; text?: unknown };
      return {
        href: String(link.href ?? ""),
        text: String(link.text ?? ""),
      };
    })
    .filter((item): item is MonsterLink => item !== null);
}

function toSections(value: unknown): MonsterSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const s = section as { title?: unknown; entries?: unknown };
      const rawEntries = Array.isArray(s.entries) ? s.entries : [];
      const entries: MonsterSectionEntry[] = rawEntries
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const e = entry as { kind?: unknown; name?: unknown; text?: unknown };
          return {
            kind: String(e.kind ?? "paragraph"),
            name: String(e.name ?? ""),
            text: String(e.text ?? ""),
          };
        })
        .filter((entry): entry is MonsterSectionEntry => entry !== null);
      return {
        title: String(s.title ?? "Section"),
        entries,
      };
    })
    .filter((section): section is MonsterSection => section !== null);
}

export function mapMonsterRow(monster: schema.Monster): MonsterWithContent {
  const tradParsed = safeJsonParse<unknown>(monster.tradJson, []);
  const detailsParsed = safeJsonParse<unknown>(monster.detailsJson, {});
  const sectionsParsed = safeJsonParse<unknown>(monster.sectionsJson, []);
  const linksParsed = safeJsonParse<unknown>(monster.linksJson, []);

  return {
    ...monster,
    trad: toStringArray(tradParsed),
    details: toRecordOfString(detailsParsed),
    sections: toSections(sectionsParsed),
    links: toLinks(linksParsed),
  };
}

export async function getMonsters(filters: MonsterFilters = {}): Promise<MonsterWithContent[]> {
  const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof like> | ReturnType<typeof or>> = [];

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(schema.monsters.type, filters.types));
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        like(schema.monsters.name, term),
        like(schema.monsters.type, term),
        like(schema.monsters.descriptionText, term)
      )!
    );
  }

  const rows = await db
    .select()
    .from(schema.monsters)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.monsters.name);

  return rows.map(mapMonsterRow);
}

export async function getMonsterById(id: number): Promise<MonsterWithContent | null> {
  const rows = await db
    .select()
    .from(schema.monsters)
    .where(eq(schema.monsters.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  return mapMonsterRow(rows[0]);
}

export async function getMonstersByIds(ids: number[]): Promise<MonsterWithContent[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select()
    .from(schema.monsters)
    .where(inArray(schema.monsters.id, ids))
    .orderBy(schema.monsters.name);
  return rows.map(mapMonsterRow);
}

export async function getMonsterCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.monsters);
  return result[0]?.count ?? 0;
}

export async function getAvailableMonsterTypes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ type: schema.monsters.type })
    .from(schema.monsters)
    .orderBy(schema.monsters.type);
  return rows.map((row) => row.type);
}

export async function getAllMonstersForAdmin() {
  return db
    .select()
    .from(schema.monsters)
    .orderBy(schema.monsters.name);
}

export async function getMonsterByIdForEdit(id: number) {
  const rows = await db
    .select()
    .from(schema.monsters)
    .where(eq(schema.monsters.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export interface MonsterMutationData {
  name: string;
  type: string;
  tradRaw: string | null;
  tradJson: string | null;
  ac: string | null;
  hp: string | null;
  speed: string | null;
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
  strMod: string | null;
  dexMod: string | null;
  conMod: string | null;
  intMod: string | null;
  wisMod: string | null;
  chaMod: string | null;
  detailsJson: string;
  sectionsJson: string;
  descriptionText: string | null;
  imageUrl: string | null;
  linksJson: string | null;
}

export async function createMonster(data: MonsterMutationData): Promise<number> {
  const [result] = await db.insert(schema.monsters).values(data);
  return Number(result.insertId);
}

export async function updateMonster(id: number, data: MonsterMutationData): Promise<void> {
  await db.update(schema.monsters).set(data).where(eq(schema.monsters.id, id));
}

export async function deleteMonster(id: number): Promise<void> {
  await db.delete(schema.monsters).where(eq(schema.monsters.id, id));
}
