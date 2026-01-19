import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import * as schema from "../app/db/schema";

dotenv.config();

const CSV_PATH = process.argv[2] || "../grimoire_dnd_structured_final.csv";

interface CsvRow {
  Nom: string;
  Niveau: string;
  Ecole: string;
  Rituel: string;
  Concentration: string;
  Temps_Valeur: string;
  Temps_Unite: string;
  Temps_Condition: string;
  Portee_Type: string;
  Portee_Valeur: string;
  Portee_Unite: string;
  Portee_Forme: string;
  Duree_Type: string;
  Duree_Valeur: string;
  Duree_Unite: string;
  Composantes: string;
  Materiaux: string;
  Niv_1: string;
  Niv_2: string;
  Niv_3: string;
  Niv_4: string;
  Niv_5: string;
  Niv_6: string;
  Niv_7: string;
  Niv_8: string;
  Niv_9: string;
  Classes: string;
  Source: string;
  Description: string;
  Niveaux_Sup_Txt: string;
}

function cleanDescription(text: string): string {
  if (!text) return text;
  
  // Remove unwanted line breaks after bold titles (e.g., "**Title**\n. Text" -> "**Title**. Text")
  let cleaned = text.replace(/\*\*([^*]+)\*\*\s*\n\s*\./g, "**$1**.");
  
  // Remove line breaks between bold titles and text that starts with lowercase
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*\s*\n\s*([a-zàâäéèêëïîôùûüÿç])/g, "**$1**. $2");
  
  // Convert bullet points (•) to Markdown list syntax
  // Handle cases where bullet points are at the start of a line or after text
  cleaned = cleaned.replace(/\n•\s*/g, "\n- ");
  cleaned = cleaned.replace(/^•\s*/gm, "- ");
  
  // Also handle cases where there's text before the list (like "...suivantes&nbsp;:•")
  cleaned = cleaned.replace(/([.:])\s*\n?•\s*/g, "$1\n- ");
  
  // Normalize multiple consecutive line breaks to double line breaks (paragraph separation)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  
  return cleaned.trim();
}

function normalizeClassName(name: string): string {
  // Normalize accents and lowercase
  const normalized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Map common variations to canonical names
  const classMap: Record<string, string> = {
    barde: "barde",
    clerc: "clerc",
    druide: "druide",
    ensorceleur: "ensorceleur",
    magicien: "magicien",
    occultiste: "occultiste",
    paladin: "paladin",
    rodeur: "rodeur",
    rôdeur: "rodeur",
    rοdeur: "rodeur",
  };

  return classMap[normalized] || normalized;
}

async function seed() {
  console.log("Starting database seed...");
  console.log(`CSV path: ${CSV_PATH}`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  // Create database if not exists
  const dbName = process.env.DB_NAME || "dnd_spells";
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);

  const db = drizzle(connection, { schema, mode: "default" });

  // Drop existing tables in correct order (foreign key constraints)
  console.log("Dropping existing tables...");
  await connection.query(`SET FOREIGN_KEY_CHECKS = 0`);
  await connection.query(`DROP TABLE IF EXISTS spell_classes`);
  await connection.query(`DROP TABLE IF EXISTS spells`);
  await connection.query(`DROP TABLE IF EXISTS classes`);
  await connection.query(`SET FOREIGN_KEY_CHECKS = 1`);

  // Create tables
  console.log("Creating tables...");
  await connection.query(`
    CREATE TABLE classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(50) NOT NULL UNIQUE,
      nom_affich VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE spells (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      niveau INT NOT NULL DEFAULT 0,
      ecole VARCHAR(50) NOT NULL,
      rituel BOOLEAN NOT NULL DEFAULT FALSE,
      concentration BOOLEAN NOT NULL DEFAULT FALSE,
      temps_valeur INT,
      temps_unite VARCHAR(50),
      temps_condition TEXT,
      portee_type VARCHAR(50),
      portee_valeur INT,
      portee_unite VARCHAR(50),
      portee_forme VARCHAR(50),
      duree_type VARCHAR(50),
      duree_valeur INT,
      duree_unite VARCHAR(50),
      composantes VARCHAR(20),
      materiaux TEXT,
      niv_1 VARCHAR(50),
      niv_2 VARCHAR(50),
      niv_3 VARCHAR(50),
      niv_4 VARCHAR(50),
      niv_5 VARCHAR(50),
      niv_6 VARCHAR(50),
      niv_7 VARCHAR(50),
      niv_8 VARCHAR(50),
      niv_9 VARCHAR(50),
      source VARCHAR(100),
      description TEXT,
      niveaux_sup_txt TEXT,
      INDEX idx_niveau (niveau),
      INDEX idx_ecole (ecole),
      INDEX idx_niveau_ecole (niveau, ecole),
      FULLTEXT INDEX idx_fulltext (nom, description)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE spell_classes (
      spell_id INT NOT NULL,
      class_id INT NOT NULL,
      PRIMARY KEY (spell_id, class_id),
      FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      INDEX idx_spell_id (spell_id),
      INDEX idx_class_id (class_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Insert classes
  console.log("Inserting classes...");
  const classesData = [
    { nom: "barde", nomAffich: "Barde" },
    { nom: "clerc", nomAffich: "Clerc" },
    { nom: "druide", nomAffich: "Druide" },
    { nom: "ensorceleur", nomAffich: "Ensorceleur" },
    { nom: "magicien", nomAffich: "Magicien" },
    { nom: "occultiste", nomAffich: "Occultiste" },
    { nom: "paladin", nomAffich: "Paladin" },
    { nom: "rodeur", nomAffich: "Rôdeur" },
  ];

  for (const classData of classesData) {
    await db.insert(schema.classes).values(classData);
  }

  // Get class IDs
  const classesResult = await db.select().from(schema.classes);
  const classIdMap = new Map<string, number>();
  for (const c of classesResult) {
    classIdMap.set(c.nom, c.id);
  }

  // Parse CSV and insert spells
  console.log("Parsing CSV and inserting spells...");
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

  console.log(`Found ${rows.length} spells in CSV`);

  let insertedCount = 0;
  for (const row of rows) {
    try {
      // Insert spell
      const [result] = await connection.query<mysql.ResultSetHeader>(
        `INSERT INTO spells (
          nom, niveau, ecole, rituel, concentration,
          temps_valeur, temps_unite, temps_condition,
          portee_type, portee_valeur, portee_unite, portee_forme,
          duree_type, duree_valeur, duree_unite,
          composantes, materiaux,
          niv_1, niv_2, niv_3, niv_4, niv_5, niv_6, niv_7, niv_8, niv_9,
          source, description, niveaux_sup_txt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.Nom || "",
          parseInt(row.Niveau) || 0,
          row.Ecole || "",
          row.Rituel === "Oui",
          row.Concentration === "Oui",
          row.Temps_Valeur ? parseInt(row.Temps_Valeur) : null,
          row.Temps_Unite || null,
          row.Temps_Condition || null,
          row.Portee_Type || null,
          row.Portee_Valeur ? parseInt(row.Portee_Valeur) : null,
          row.Portee_Unite || null,
          row.Portee_Forme || null,
          row.Duree_Type || null,
          row.Duree_Valeur ? parseInt(row.Duree_Valeur) : null,
          row.Duree_Unite || null,
          row.Composantes || null,
          row.Materiaux || null,
          row.Niv_1 || null,
          row.Niv_2 || null,
          row.Niv_3 || null,
          row.Niv_4 || null,
          row.Niv_5 || null,
          row.Niv_6 || null,
          row.Niv_7 || null,
          row.Niv_8 || null,
          row.Niv_9 || null,
          row.Source || null,
          cleanDescription(row.Description) || null,
          cleanDescription(row.Niveaux_Sup_Txt) || null,
        ]
      );

      const spellId = result.insertId;

      // Insert spell-class relationships
      if (row.Classes) {
        const classList = row.Classes.split(",").map((c) => c.trim());
        for (const className of classList) {
          const normalizedName = normalizeClassName(className);
          const classId = classIdMap.get(normalizedName);
          if (classId) {
            await connection.query(
              `INSERT INTO spell_classes (spell_id, class_id) VALUES (?, ?)`,
              [spellId, classId]
            );
          }
        }
      }

      insertedCount++;
      if (insertedCount % 50 === 0) {
        console.log(`Inserted ${insertedCount} spells...`);
      }
    } catch (error) {
      console.error(`Error inserting spell "${row.Nom}":`, error);
    }
  }

  console.log(`\nSeed completed!`);
  console.log(`Total spells inserted: ${insertedCount}`);

  // Verify counts
  const [spellCount] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM spells`
  );
  const [relationCount] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM spell_classes`
  );
  console.log(`Spells in database: ${spellCount[0].count}`);
  console.log(`Spell-class relations: ${relationCount[0].count}`);

  await connection.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
