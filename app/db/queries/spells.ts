import { eq, and, inArray, like, or, sql } from "drizzle-orm";
import { db, schema } from "../index";

export interface SpellFilters {
  classes?: string[];
  levels?: number[];
  search?: string;
}

export interface SpellWithClasses {
  id: number;
  nom: string;
  niveau: number;
  ecole: string;
  rituel: boolean;
  concentration: boolean;
  tempsValeur: number | null;
  tempsUnite: string | null;
  tempsCondition: string | null;
  porteeType: string | null;
  porteeValeur: number | null;
  porteeUnite: string | null;
  porteeForme: string | null;
  dureeType: string | null;
  dureeValeur: number | null;
  dureeUnite: string | null;
  composantes: string | null;
  materiaux: string | null;
  niv1: string | null;
  niv2: string | null;
  niv3: string | null;
  niv4: string | null;
  niv5: string | null;
  niv6: string | null;
  niv7: string | null;
  niv8: string | null;
  niv9: string | null;
  source: string | null;
  description: string | null;
  niveauxSupTxt: string | null;
  classes: string[];
}

export async function getSpells(filters: SpellFilters = {}): Promise<SpellWithClasses[]> {
  const { classes: classFilter, levels, search } = filters;

  // Build base query conditions
  const conditions: ReturnType<typeof and>[] = [];

  if (levels && levels.length > 0) {
    conditions.push(inArray(schema.spells.niveau, levels));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(
        like(schema.spells.nom, searchTerm),
        like(schema.spells.description, searchTerm)
      )
    );
  }

  // If filtering by class, we need to use a subquery
  let spellIdsWithClass: number[] | null = null;
  if (classFilter && classFilter.length > 0) {
    const classRows = await db
      .select({ id: schema.classes.id })
      .from(schema.classes)
      .where(inArray(schema.classes.nom, classFilter));

    const classIds = classRows.map((c) => c.id);

    if (classIds.length > 0) {
      const spellClassRows = await db
        .select({ spellId: schema.spellClasses.spellId })
        .from(schema.spellClasses)
        .where(inArray(schema.spellClasses.classId, classIds));

      spellIdsWithClass = [...new Set(spellClassRows.map((sc) => sc.spellId))];
    } else {
      return [];
    }
  }

  if (spellIdsWithClass !== null) {
    if (spellIdsWithClass.length === 0) return [];
    conditions.push(inArray(schema.spells.id, spellIdsWithClass));
  }

  // Get spells
  const spellsResult = await db
    .select()
    .from(schema.spells)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schema.spells.niveau, schema.spells.nom);

  if (spellsResult.length === 0) return [];

  // Get classes for each spell
  const spellIds = spellsResult.map((s) => s.id);
  const spellClassesResult = await db
    .select({
      spellId: schema.spellClasses.spellId,
      className: schema.classes.nomAffich,
    })
    .from(schema.spellClasses)
    .innerJoin(schema.classes, eq(schema.spellClasses.classId, schema.classes.id))
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

export async function getSpellById(id: number): Promise<SpellWithClasses | null> {
  const spellResult = await db
    .select()
    .from(schema.spells)
    .where(eq(schema.spells.id, id))
    .limit(1);

  if (spellResult.length === 0) return null;

  const spell = spellResult[0];

  const classesResult = await db
    .select({ className: schema.classes.nomAffich })
    .from(schema.spellClasses)
    .innerJoin(schema.classes, eq(schema.spellClasses.classId, schema.classes.id))
    .where(eq(schema.spellClasses.spellId, id));

  return {
    ...spell,
    classes: classesResult.map((c) => c.className),
  };
}

export async function getAllClasses() {
  return db.select().from(schema.classes).orderBy(schema.classes.nomAffich);
}

export async function getSpellCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.spells);
  return result[0]?.count ?? 0;
}

export async function getAvailableLevelsByClass(classNames?: string[]): Promise<number[]> {
  // Si aucune classe n'est sélectionnée, retourner tous les niveaux possibles (0-9)
  if (!classNames || classNames.length === 0) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  // Récupérer les IDs des classes
  const classRows = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(inArray(schema.classes.nom, classNames));

  const classIds = classRows.map((c) => c.id);
  
  if (classIds.length === 0) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  // Récupérer les niveaux distincts des sorts disponibles pour ces classes
  const levelsResult = await db
    .selectDistinct({ niveau: schema.spells.niveau })
    .from(schema.spells)
    .innerJoin(schema.spellClasses, eq(schema.spells.id, schema.spellClasses.spellId))
    .where(inArray(schema.spellClasses.classId, classIds))
    .orderBy(schema.spells.niveau);

  return levelsResult.map((row) => row.niveau);
}
