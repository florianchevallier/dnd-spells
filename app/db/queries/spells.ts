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

export interface UpdateSpellData {
  nom?: string;
  niveau?: number;
  ecole?: string;
  rituel?: boolean;
  concentration?: boolean;
  tempsValeur?: number | null;
  tempsUnite?: string | null;
  tempsCondition?: string | null;
  porteeType?: string | null;
  porteeValeur?: number | null;
  porteeUnite?: string | null;
  porteeForme?: string | null;
  dureeType?: string | null;
  dureeValeur?: number | null;
  dureeUnite?: string | null;
  composantes?: string | null;
  materiaux?: string | null;
  niv1?: string | null;
  niv2?: string | null;
  niv3?: string | null;
  niv4?: string | null;
  niv5?: string | null;
  niv6?: string | null;
  niv7?: string | null;
  niv8?: string | null;
  niv9?: string | null;
  source?: string | null;
  description?: string | null;
  niveauxSupTxt?: string | null;
}

export async function updateSpell(id: number, data: UpdateSpellData) {
  await db
    .update(schema.spells)
    .set(data)
    .where(eq(schema.spells.id, id));
}

export async function deleteSpell(id: number) {
  await db.delete(schema.spells).where(eq(schema.spells.id, id));
}

export async function createSpell(data: Omit<schema.Spell, "id">, classIds: number[]) {
  const [result] = await db.insert(schema.spells).values(data);

  if (classIds.length > 0) {
    const spellClassesData = classIds.map((classId) => ({
      spellId: Number(result.insertId),
      classId,
    }));
    await db.insert(schema.spellClasses).values(spellClassesData);
  }

  return Number(result.insertId);
}

export async function updateSpellClasses(spellId: number, classIds: number[]) {
  await db.delete(schema.spellClasses).where(eq(schema.spellClasses.spellId, spellId));

  if (classIds.length > 0) {
    const spellClassesData = classIds.map((classId) => ({
      spellId,
      classId,
    }));
    await db.insert(schema.spellClasses).values(spellClassesData);
  }
}

export async function getClassByNom(nom: string) {
  const result = await db
    .select()
    .from(schema.classes)
    .where(eq(schema.classes.nom, nom))
    .limit(1);
  return result[0] || null;
}

export async function getAllSpellsForAdmin() {
  const spellsResult = await db
    .select()
    .from(schema.spells)
    .orderBy(schema.spells.niveau, schema.spells.nom);

  if (spellsResult.length === 0) return [];

  const spellIds = spellsResult.map((s) => s.id);
  const spellClassesResult = await db
    .select({
      spellId: schema.spellClasses.spellId,
      classId: schema.spellClasses.classId,
      classNom: schema.classes.nom,
      classNomAffich: schema.classes.nomAffich,
    })
    .from(schema.spellClasses)
    .innerJoin(schema.classes, eq(schema.spellClasses.classId, schema.classes.id))
    .where(inArray(schema.spellClasses.spellId, spellIds));

  const classesMap = new Map<number, { ids: number[]; noms: string[]; nomsAffich: string[] }>();
  for (const row of spellClassesResult) {
    if (!classesMap.has(row.spellId)) {
      classesMap.set(row.spellId, { ids: [], noms: [], nomsAffich: [] });
    }
    classesMap.get(row.spellId)!.ids.push(row.classId);
    classesMap.get(row.spellId)!.noms.push(row.classNom);
    classesMap.get(row.spellId)!.nomsAffich.push(row.classNomAffich);
  }

  return spellsResult.map((spell) => ({
    ...spell,
    classes: classesMap.get(spell.id) || { ids: [], noms: [], nomsAffich: [] },
  }));
}

export async function getSpellByIdForEdit(id: number) {
  const spellResult = await db
    .select()
    .from(schema.spells)
    .where(eq(schema.spells.id, id))
    .limit(1);

  if (spellResult.length === 0) return null;

  const spell = spellResult[0];

  const classesResult = await db
    .select({
      classId: schema.classes.id,
      classNom: schema.classes.nom,
      classNomAffich: schema.classes.nomAffich,
    })
    .from(schema.spellClasses)
    .innerJoin(schema.classes, eq(schema.spellClasses.classId, schema.classes.id))
    .where(eq(schema.spellClasses.spellId, id));

  return {
    ...spell,
    classes: {
      ids: classesResult.map((c) => c.classId),
      noms: classesResult.map((c) => c.classNom),
      nomsAffich: classesResult.map((c) => c.classNomAffich),
    },
  };
}
