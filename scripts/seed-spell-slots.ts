import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as schema from "../app/db/schema.server";

dotenv.config();

const CSV_PATH = process.argv[2] || "./classes.csv";

interface CsvRow {
  Classe: string;
  Sous_Classe: string;
  Niveau: string;
  Niv_1: string;
  Niv_2: string;
  Niv_3: string;
  Niv_4: string;
  Niv_5: string;
  Niv_6: string;
  Niv_7: string;
  Niv_8: string;
  Niv_9: string;
}

// Normalize class name to database format
function normalizeClassName(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Map CSV names to database names
  const classMap: Record<string, string> = {
    artificier: "artificier",
    barde: "barde",
    clerc: "clerc",
    druide: "druide",
    ensorceleur: "ensorceleur",
    guerrier: "guerrier",
    magicien: "magicien",
    paladin: "paladin",
    roublard: "roublard",
    rodeur: "rodeur",
    "sorcier (occultiste)": "occultiste",
  };

  return classMap[normalized] || normalized;
}

// Get display name for a class
function getClassDisplayName(normalizedName: string): string {
  const displayMap: Record<string, string> = {
    artificier: "Artificier",
    barde: "Barde",
    clerc: "Clerc",
    druide: "Druide",
    ensorceleur: "Ensorceleur",
    guerrier: "Guerrier",
    magicien: "Magicien",
    paladin: "Paladin",
    roublard: "Roublard",
    rodeur: "Rodeur",
    occultiste: "Occultiste",
  };

  return displayMap[normalizedName] || normalizedName;
}

// Normalize subclass name for storage
function normalizeSubclassName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

async function seed() {
  console.log("Starting spell slots seed...");
  console.log(`CSV path: ${CSV_PATH}`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "dnd_spells",
    multipleStatements: true,
  });

  const db = drizzle(connection, { schema, mode: "default" });

  // Clear existing spell slots and subclasses data
  console.log("Clearing existing spell slots and subclasses data...");
  await connection.query(`DELETE FROM class_spell_slots`);
  await connection.query(`DELETE FROM subclasses`);

  // Parse CSV
  console.log("Parsing CSV...");
  const rows: CsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    createReadStream(CSV_PATH, { encoding: "utf-8" })
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          bom: true,
          relax_quotes: true,
          relax_column_count: true,
        })
      )
      .on("data", (row: CsvRow) => {
        rows.push(row);
      })
      .on("end", () => resolve())
      .on("error", reject);
  });

  console.log(`Found ${rows.length} spell slot entries in CSV`);

  // Get existing classes and create a map
  const existingClasses = await db.select().from(schema.classes);
  const classIdMap = new Map<string, number>();
  for (const c of existingClasses) {
    classIdMap.set(c.nom, c.id);
  }

  // Find unique classes and subclasses from CSV
  const uniqueClasses = new Map<string, string>(); // normalized -> display
  const uniqueSubclasses = new Map<
    string,
    { className: string; subclassName: string; displayName: string }
  >();

  for (const row of rows) {
    const normalizedClass = normalizeClassName(row.Classe);
    uniqueClasses.set(normalizedClass, getClassDisplayName(normalizedClass));

    const subclassKey = `${normalizedClass}:${normalizeSubclassName(row.Sous_Classe)}`;
    if (!uniqueSubclasses.has(subclassKey)) {
      uniqueSubclasses.set(subclassKey, {
        className: normalizedClass,
        subclassName: normalizeSubclassName(row.Sous_Classe),
        displayName: row.Sous_Classe,
      });
    }
  }

  // Insert missing classes
  console.log("Checking for missing classes...");
  for (const [normalizedName, displayName] of uniqueClasses) {
    if (!classIdMap.has(normalizedName)) {
      console.log(`  Adding missing class: ${displayName}`);
      const result = await db
        .insert(schema.classes)
        .values({ nom: normalizedName, nomAffich: displayName });
      // Get the inserted ID
      const [newClass] = await db
        .select()
        .from(schema.classes)
        .where(eq(schema.classes.nom, normalizedName));
      classIdMap.set(normalizedName, newClass.id);
    }
  }

  // Insert subclasses
  console.log("Inserting subclasses...");
  const subclassIdMap = new Map<string, number>();

  for (const [key, subclass] of uniqueSubclasses) {
    const classId = classIdMap.get(subclass.className);
    if (!classId) {
      console.error(
        `  Warning: Class not found for subclass ${subclass.displayName}`
      );
      continue;
    }

    const result = await db.insert(schema.subclasses).values({
      classId,
      nom: subclass.subclassName,
      nomAffich: subclass.displayName,
    });

    // Get the inserted ID
    const [newSubclass] = await db
      .select()
      .from(schema.subclasses)
      .where(
        and(
          eq(schema.subclasses.nom, subclass.subclassName),
          eq(schema.subclasses.classId, classId)
        )
      );
    subclassIdMap.set(key, newSubclass.id);
  }

  console.log(`  Inserted ${uniqueSubclasses.size} subclasses`);

  // Insert spell slots
  console.log("Inserting spell slot progression data...");
  let insertedCount = 0;

  for (const row of rows) {
    const normalizedClass = normalizeClassName(row.Classe);
    const classId = classIdMap.get(normalizedClass);
    if (!classId) {
      console.error(`  Warning: Class not found: ${row.Classe}`);
      continue;
    }

    const subclassKey = `${normalizedClass}:${normalizeSubclassName(row.Sous_Classe)}`;
    const subclassId = subclassIdMap.get(subclassKey);
    if (!subclassId) {
      console.error(`  Warning: Subclass not found: ${row.Sous_Classe}`);
      continue;
    }

    await db.insert(schema.classSpellSlots).values({
      classId,
      subclassId,
      characterLevel: parseInt(row.Niveau) || 1,
      slotLevel1: parseInt(row.Niv_1) || 0,
      slotLevel2: parseInt(row.Niv_2) || 0,
      slotLevel3: parseInt(row.Niv_3) || 0,
      slotLevel4: parseInt(row.Niv_4) || 0,
      slotLevel5: parseInt(row.Niv_5) || 0,
      slotLevel6: parseInt(row.Niv_6) || 0,
      slotLevel7: parseInt(row.Niv_7) || 0,
      slotLevel8: parseInt(row.Niv_8) || 0,
      slotLevel9: parseInt(row.Niv_9) || 0,
    });

    insertedCount++;
    if (insertedCount % 100 === 0) {
      console.log(`  Inserted ${insertedCount} spell slot entries...`);
    }
  }

  console.log(`\nSeed completed!`);
  console.log(`Total classes: ${classIdMap.size}`);
  console.log(`Total subclasses: ${subclassIdMap.size}`);
  console.log(`Total spell slot entries: ${insertedCount}`);

  // Verify counts
  const [slotCount] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM class_spell_slots`
  );
  const [subclassCount] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM subclasses`
  );
  console.log(`\nVerification:`);
  console.log(`  Spell slots in database: ${slotCount[0].count}`);
  console.log(`  Subclasses in database: ${subclassCount[0].count}`);

  await connection.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
