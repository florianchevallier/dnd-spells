import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const spells = mysqlTable(
  "spells",
  {
    id: int("id").primaryKey().autoincrement(),
    nom: varchar("nom", { length: 255 }).notNull(),
    niveau: int("niveau").notNull().default(0),
    ecole: varchar("ecole", { length: 50 }).notNull(),
    rituel: boolean("rituel").notNull().default(false),
    concentration: boolean("concentration").notNull().default(false),
    tempsValeur: int("temps_valeur"),
    tempsUnite: varchar("temps_unite", { length: 50 }),
    tempsCondition: text("temps_condition"),
    porteeType: varchar("portee_type", { length: 50 }),
    porteeValeur: int("portee_valeur"),
    porteeUnite: varchar("portee_unite", { length: 50 }),
    porteeForme: varchar("portee_forme", { length: 50 }),
    dureeType: varchar("duree_type", { length: 50 }),
    dureeValeur: int("duree_valeur"),
    dureeUnite: varchar("duree_unite", { length: 50 }),
    composantes: varchar("composantes", { length: 20 }),
    materiaux: text("materiaux"),
    niv1: varchar("niv_1", { length: 50 }),
    niv2: varchar("niv_2", { length: 50 }),
    niv3: varchar("niv_3", { length: 50 }),
    niv4: varchar("niv_4", { length: 50 }),
    niv5: varchar("niv_5", { length: 50 }),
    niv6: varchar("niv_6", { length: 50 }),
    niv7: varchar("niv_7", { length: 50 }),
    niv8: varchar("niv_8", { length: 50 }),
    niv9: varchar("niv_9", { length: 50 }),
    source: varchar("source", { length: 100 }),
    description: text("description"),
    niveauxSupTxt: text("niveaux_sup_txt"),
  },
  (table) => [
    index("idx_niveau").on(table.niveau),
    index("idx_ecole").on(table.ecole),
    index("idx_niveau_ecole").on(table.niveau, table.ecole),
  ]
);

export const classes = mysqlTable("classes", {
  id: int("id").primaryKey().autoincrement(),
  nom: varchar("nom", { length: 50 }).notNull().unique(),
  nomAffich: varchar("nom_affich", { length: 50 }).notNull(),
});

export const spellClasses = mysqlTable(
  "spell_classes",
  {
    spellId: int("spell_id")
      .notNull()
      .references(() => spells.id, { onDelete: "cascade" }),
    classId: int("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.spellId, table.classId] }),
    index("idx_spell_id").on(table.spellId),
    index("idx_class_id").on(table.classId),
  ]
);

// Relations
export const spellsRelations = relations(spells, ({ many }) => ({
  spellClasses: many(spellClasses),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  spellClasses: many(spellClasses),
}));

export const spellClassesRelations = relations(spellClasses, ({ one }) => ({
  spell: one(spells, {
    fields: [spellClasses.spellId],
    references: [spells.id],
  }),
  class: one(classes, {
    fields: [spellClasses.classId],
    references: [classes.id],
  }),
}));

// Types
export type Spell = typeof spells.$inferSelect;
export type NewSpell = typeof spells.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type SpellClass = typeof spellClasses.$inferSelect;
