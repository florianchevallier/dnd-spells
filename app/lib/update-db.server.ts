import type { ActionFunction } from "react-router";
import { parse } from "csv-parse";
import { Readable } from "stream";
import mysql from "mysql2/promise";

interface SpellCsvRow {
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

interface ClassCsvRow {
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

interface MonsterCsvRow {
  name: string;
  type: string;
  trad_raw?: string;
  trad_json?: string;
  ac?: string;
  hp?: string;
  speed?: string;
  str?: string;
  dex?: string;
  con?: string;
  int?: string;
  wis?: string;
  cha?: string;
  str_mod?: string;
  dex_mod?: string;
  con_mod?: string;
  int_mod?: string;
  wis_mod?: string;
  cha_mod?: string;
  details_json?: string;
  sections_json?: string;
  description_text?: string;
  image_url?: string;
  links_json?: string;
}

function cleanDescription(text: string): string {
  if (!text) return text;

  let cleaned = text.replace(/\*\*([^*]+)\*\*\s*\n\s*\./g, "**$1**.");
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*\s*\n\s*([a-zàâäéèêëïîôùûüÿç])/g, "**$1**. $2");
  cleaned = cleaned.replace(/\n•\s*/g, "\n- ");
  cleaned = cleaned.replace(/^•\s*/gm, "- ");
  cleaned = cleaned.replace(/([.:])\s*\n?•\s*/g, "$1\n- ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

function normalizeClassName(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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
    rôdeur: "rodeur",
    rοdeur: "rodeur",
    "sorcier (occultiste)": "occultiste",
    occultiste: "occultiste",
  };

  return classMap[normalized] || normalized;
}

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
    rodeur: "Rôdeur",
    occultiste: "Occultiste",
  };

  return displayMap[normalizedName] || normalizedName;
}

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

function parseOptionalInt(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function detectDelimiter(firstLine: string): string {
  const candidates = ["|", ",", ";", "\t"];
  let best = ",";
  let bestCount = 0;

  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
}

function detectCsvType(firstRow: any): "spells" | "classes" | "monsters" {
  if ("name" in firstRow && "type" in firstRow && "details_json" in firstRow && "sections_json" in firstRow) {
    return "monsters";
  }
  if ("Classe" in firstRow && "Sous_Classe" in firstRow) {
    return "classes";
  }
  return "spells";
}

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csvFile") as File;

    if (!csvFile || csvFile.size === 0) {
      return { error: "Veuillez sélectionner un fichier CSV" };
    }

    if (!csvFile.name.endsWith('.csv')) {
      return { error: "Le fichier doit être au format CSV" };
    }

    const arrayBuffer = await csvFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const csvText = buffer.toString("utf-8");
    const firstLine = csvText.split(/\r?\n/, 1)[0] || "";
    const delimiter = detectDelimiter(firstLine);
    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            bom: true,
            relax_quotes: true,
            relax_column_count: true,
            delimiter,
          })
        )
        .on("data", (row: any) => {
          rows.push(row);
        })
        .on("end", () => resolve())
        .on("error", reject);
    });

    if (rows.length === 0) {
      return { error: "Le fichier CSV est vide" };
    }

    const csvType = detectCsvType(rows[0]);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    });

    try {
      const dbName = process.env.DB_NAME || "dnd_spells";
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.query(`USE \`${dbName}\``);

      if (csvType === "classes") {
        return await importClassesAndSpellSlots(connection, rows as ClassCsvRow[]);
      } else if (csvType === "monsters") {
        return await importMonsters(connection, rows as MonsterCsvRow[]);
      } else {
        return await importSpells(connection, rows as SpellCsvRow[]);
      }
    } finally {
      await connection.end();
    }
  } catch (error) {
    return {
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

async function importSpells(
  connection: mysql.Connection,
  rows: SpellCsvRow[]
) {
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  await connection.query("DROP TABLE IF EXISTS spell_classes");
  await connection.query("DROP TABLE IF EXISTS spells");
  await connection.query("DROP TABLE IF EXISTS classes");
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");

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

  // Find unique classes from CSV
  const uniqueClasses = new Map<string, string>();
  for (const row of rows) {
    if (row.Classes) {
      const classList = row.Classes.split(",").map((c) => c.trim());
      for (const className of classList) {
        const normalizedName = normalizeClassName(className);
        uniqueClasses.set(normalizedName, getClassDisplayName(normalizedName));
      }
    }
  }

  // Get existing classes
  const [existingClassesRows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT id, nom FROM classes"
  );
  const classIdMap = new Map<string, number>();
  for (const c of existingClassesRows) {
    classIdMap.set(c.nom, c.id);
  }

  // Insert missing classes
  for (const [normalizedName, displayName] of uniqueClasses) {
    if (!classIdMap.has(normalizedName)) {
      const [result] = await connection.query<mysql.ResultSetHeader>(
        "INSERT INTO classes (nom, nom_affich) VALUES (?, ?)",
        [normalizedName, displayName]
      );
      classIdMap.set(normalizedName, result.insertId);
    }
  }

  let insertedCount = 0;
  let errorCount = 0;
  const errorDetails: string[] = [];
  for (const row of rows) {
    try {
      if (!row.Nom || row.Nom.trim().toLowerCase() === "nom") {
        continue;
      }
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
          Number.isFinite(Number.parseInt(row.Niveau, 10))
            ? Number.parseInt(row.Niveau, 10)
            : 0,
          row.Ecole || "",
          row.Rituel === "Oui",
          row.Concentration === "Oui",
          parseOptionalInt(row.Temps_Valeur),
          row.Temps_Unite || null,
          row.Temps_Condition || null,
          row.Portee_Type || null,
          parseOptionalInt(row.Portee_Valeur),
          row.Portee_Unite || null,
          row.Portee_Forme || null,
          row.Duree_Type || null,
          parseOptionalInt(row.Duree_Valeur),
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

      if (row.Classes) {
        const classList = row.Classes.split(",").map((c) => c.trim());
        for (const className of classList) {
          const normalizedName = normalizeClassName(className);
          const classId = classIdMap.get(normalizedName);
          if (classId) {
            await connection.query(
              "INSERT INTO spell_classes (spell_id, class_id) VALUES (?, ?)",
              [spellId, classId]
            );
          }
        }
      }

      insertedCount++;
    } catch (insertError) {
      errorCount++;
      if (errorDetails.length < 5) {
        const message = insertError instanceof Error ? insertError.message : "Erreur inconnue";
        const spellName = row.Nom ? `"${row.Nom}"` : "(nom manquant)";
        errorDetails.push(`${spellName}: ${message}`);
      }
    }
  }

  const errorSuffix = errorCount > 0 ? ` (${errorCount} erreurs d'import)` : "";
  const details =
    errorCount > 0
      ? `Exemples d'erreurs: ${errorDetails.join(" | ")}${errorCount > 5 ? " | ..." : ""}`
      : undefined;
  return {
    success: true,
    message: `Base de donnees mise a jour avec succes ! ${insertedCount} sorts importes${errorSuffix}.`,
    details,
  };
}

async function importClassesAndSpellSlots(
  connection: mysql.Connection,
  rows: ClassCsvRow[]
) {
  // Clear existing spell slots and subclasses data
  await connection.query(`DELETE FROM class_spell_slots`);
  await connection.query(`DELETE FROM subclasses`);

  // Get existing classes
  const [existingClassesRows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT id, nom FROM classes"
  );
  const classIdMap = new Map<string, number>();
  for (const c of existingClassesRows) {
    classIdMap.set(c.nom, c.id);
  }

  // Find unique classes and subclasses from CSV
  const uniqueClasses = new Map<string, string>();
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
  for (const [normalizedName, displayName] of uniqueClasses) {
    if (!classIdMap.has(normalizedName)) {
      const [result] = await connection.query<mysql.ResultSetHeader>(
        "INSERT INTO classes (nom, nom_affich) VALUES (?, ?)",
        [normalizedName, displayName]
      );
      classIdMap.set(normalizedName, result.insertId);
    }
  }

  // Insert subclasses
  const subclassIdMap = new Map<string, number>();
  for (const [key, subclass] of uniqueSubclasses) {
    const classId = classIdMap.get(subclass.className);
    if (!classId) {
      continue;
    }

    const [result] = await connection.query<mysql.ResultSetHeader>(
      "INSERT INTO subclasses (class_id, nom, nom_affich) VALUES (?, ?, ?)",
      [classId, subclass.subclassName, subclass.displayName]
    );
    subclassIdMap.set(key, result.insertId);
  }

  // Insert spell slots
  let insertedCount = 0;
  let errorCount = 0;
  const errorDetails: string[] = [];

  for (const row of rows) {
    try {
      const normalizedClass = normalizeClassName(row.Classe);
      const classId = classIdMap.get(normalizedClass);
      if (!classId) {
        errorCount++;
        if (errorDetails.length < 5) {
          errorDetails.push(`Classe non trouvée: ${row.Classe}`);
        }
        continue;
      }

      const subclassKey = `${normalizedClass}:${normalizeSubclassName(row.Sous_Classe)}`;
      const subclassId = subclassIdMap.get(subclassKey);
      if (!subclassId) {
        errorCount++;
        if (errorDetails.length < 5) {
          errorDetails.push(`Sous-classe non trouvée: ${row.Sous_Classe}`);
        }
        continue;
      }

      await connection.query(
        `INSERT INTO class_spell_slots (
          class_id, subclass_id, character_level,
          slot_level_1, slot_level_2, slot_level_3, slot_level_4, slot_level_5,
          slot_level_6, slot_level_7, slot_level_8, slot_level_9
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          classId,
          subclassId,
          parseInt(row.Niveau) || 1,
          parseInt(row.Niv_1) || 0,
          parseInt(row.Niv_2) || 0,
          parseInt(row.Niv_3) || 0,
          parseInt(row.Niv_4) || 0,
          parseInt(row.Niv_5) || 0,
          parseInt(row.Niv_6) || 0,
          parseInt(row.Niv_7) || 0,
          parseInt(row.Niv_8) || 0,
          parseInt(row.Niv_9) || 0,
        ]
      );

      insertedCount++;
    } catch (insertError) {
      errorCount++;
      if (errorDetails.length < 5) {
        const message = insertError instanceof Error ? insertError.message : "Erreur inconnue";
        errorDetails.push(`${row.Classe} ${row.Sous_Classe} niv.${row.Niveau}: ${message}`);
      }
    }
  }

  const errorSuffix = errorCount > 0 ? ` (${errorCount} erreurs d'import)` : "";
  const details =
    errorCount > 0
      ? `Exemples d'erreurs: ${errorDetails.join(" | ")}${errorCount > 5 ? " | ..." : ""}`
      : undefined;
  return {
    success: true,
    message: `Emplacements de sorts importes avec succes ! ${uniqueSubclasses.size} sous-classes et ${insertedCount} entrees d'emplacements de sorts importees${errorSuffix}.`,
    details,
  };
}

function normalizeJson(value: string | undefined, fallback: unknown): string {
  const raw = (value || "").trim();
  if (!raw) return JSON.stringify(fallback);
  try {
    return JSON.stringify(JSON.parse(raw));
  } catch {
    return JSON.stringify(fallback);
  }
}

async function ensureMonsterTables(connection: mysql.Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS monsters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      type VARCHAR(255) NOT NULL,
      trad_raw TEXT,
      trad_json TEXT,
      ac VARCHAR(255),
      hp VARCHAR(255),
      speed VARCHAR(255),
      str INT NULL,
      dex INT NULL,
      con INT NULL,
      \`int\` INT NULL,
      wis INT NULL,
      cha INT NULL,
      str_mod VARCHAR(16),
      dex_mod VARCHAR(16),
      con_mod VARCHAR(16),
      int_mod VARCHAR(16),
      wis_mod VARCHAR(16),
      cha_mod VARCHAR(16),
      details_json TEXT NOT NULL,
      sections_json TEXT NOT NULL,
      description_text TEXT,
      image_url VARCHAR(512),
      links_json TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_monster_name (name),
      INDEX idx_monster_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_favorite_monsters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      monster_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_favorite_user_id (user_id),
      INDEX idx_favorite_monster_id (monster_id),
      INDEX idx_favorite_user_monster (user_id, monster_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (monster_id) REFERENCES monsters(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function importMonsters(connection: mysql.Connection, rows: MonsterCsvRow[]) {
  await ensureMonsterTables(connection);

  let upsertedCount = 0;
  let errorCount = 0;
  const errorDetails: string[] = [];
  const importedNames = new Set<string>();

  for (const row of rows) {
    try {
      const name = String(row.name || "").trim();
      if (!name || name.toLowerCase() === "name") continue;

      const type = String(row.type || "").trim();
      if (!type) {
        throw new Error("Type manquant");
      }

      await connection.query(
        `INSERT INTO monsters (
          name, type, trad_raw, trad_json, ac, hp, speed, str, dex, con, \`int\`, wis, cha,
          str_mod, dex_mod, con_mod, int_mod, wis_mod, cha_mod, details_json, sections_json,
          description_text, image_url, links_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          type = VALUES(type),
          trad_raw = VALUES(trad_raw),
          trad_json = VALUES(trad_json),
          ac = VALUES(ac),
          hp = VALUES(hp),
          speed = VALUES(speed),
          str = VALUES(str),
          dex = VALUES(dex),
          con = VALUES(con),
          \`int\` = VALUES(\`int\`),
          wis = VALUES(wis),
          cha = VALUES(cha),
          str_mod = VALUES(str_mod),
          dex_mod = VALUES(dex_mod),
          con_mod = VALUES(con_mod),
          int_mod = VALUES(int_mod),
          wis_mod = VALUES(wis_mod),
          cha_mod = VALUES(cha_mod),
          details_json = VALUES(details_json),
          sections_json = VALUES(sections_json),
          description_text = VALUES(description_text),
          image_url = VALUES(image_url),
          links_json = VALUES(links_json),
          updated_at = CURRENT_TIMESTAMP`,
        [
          name,
          type,
          String(row.trad_raw || "").trim() || null,
          normalizeJson(row.trad_json, []),
          String(row.ac || "").trim() || null,
          String(row.hp || "").trim() || null,
          String(row.speed || "").trim() || null,
          parseOptionalInt(row.str),
          parseOptionalInt(row.dex),
          parseOptionalInt(row.con),
          parseOptionalInt(row.int),
          parseOptionalInt(row.wis),
          parseOptionalInt(row.cha),
          String(row.str_mod || "").trim() || null,
          String(row.dex_mod || "").trim() || null,
          String(row.con_mod || "").trim() || null,
          String(row.int_mod || "").trim() || null,
          String(row.wis_mod || "").trim() || null,
          String(row.cha_mod || "").trim() || null,
          normalizeJson(row.details_json, {}),
          normalizeJson(row.sections_json, []),
          String(row.description_text || "").trim() || null,
          String(row.image_url || "").trim() || null,
          normalizeJson(row.links_json, []),
        ]
      );

      importedNames.add(name);
      upsertedCount++;
    } catch (insertError) {
      errorCount++;
      if (errorDetails.length < 5) {
        const message = insertError instanceof Error ? insertError.message : "Erreur inconnue";
        errorDetails.push(`${row.name || "(nom manquant)"}: ${message}`);
      }
    }
  }

  if (importedNames.size > 0) {
    const names = [...importedNames];
    const placeholders = names.map(() => "?").join(",");
    await connection.query(`DELETE FROM monsters WHERE name NOT IN (${placeholders})`, names);
  }

  const errorSuffix = errorCount > 0 ? ` (${errorCount} erreurs d'import)` : "";
  const details =
    errorCount > 0
      ? `Exemples d'erreurs: ${errorDetails.join(" | ")}${errorCount > 5 ? " | ..." : ""}`
      : undefined;

  return {
    success: true,
    message: `Bestiaire importé avec succès ! ${upsertedCount} monstres traités${errorSuffix}.`,
    details,
  };
}
