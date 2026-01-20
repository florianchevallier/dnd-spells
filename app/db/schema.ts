import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  primaryKey,
  index,
  timestamp,
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

// Users table for authentication
export const users = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("idx_email").on(table.email)]
);

// Sessions table for session management
export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_user_id").on(table.userId)]
);

// Subclasses table for D&D subclasses
export const subclasses = mysqlTable(
  "subclasses",
  {
    id: int("id").primaryKey().autoincrement(),
    classId: int("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    nom: varchar("nom", { length: 100 }).notNull(),
    nomAffich: varchar("nom_affich", { length: 100 }).notNull(),
  },
  (table) => [
    index("idx_subclass_class_id").on(table.classId),
    index("idx_subclass_nom").on(table.nom),
  ]
);

// Class spell slots progression table
export const classSpellSlots = mysqlTable(
  "class_spell_slots",
  {
    id: int("id").primaryKey().autoincrement(),
    classId: int("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subclassId: int("subclass_id").references(() => subclasses.id, {
      onDelete: "cascade",
    }),
    characterLevel: int("character_level").notNull(),
    slotLevel1: int("slot_level_1").default(0).notNull(),
    slotLevel2: int("slot_level_2").default(0).notNull(),
    slotLevel3: int("slot_level_3").default(0).notNull(),
    slotLevel4: int("slot_level_4").default(0).notNull(),
    slotLevel5: int("slot_level_5").default(0).notNull(),
    slotLevel6: int("slot_level_6").default(0).notNull(),
    slotLevel7: int("slot_level_7").default(0).notNull(),
    slotLevel8: int("slot_level_8").default(0).notNull(),
    slotLevel9: int("slot_level_9").default(0).notNull(),
  },
  (table) => [
    index("idx_slots_class_id").on(table.classId),
    index("idx_slots_subclass_id").on(table.subclassId),
    index("idx_slots_character_level").on(table.characterLevel),
  ]
);

// Characters table for user characters
export const characters = mysqlTable(
  "characters",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    classId: int("class_id")
      .notNull()
      .references(() => classes.id),
    subclassId: int("subclass_id").references(() => subclasses.id),
    level: int("level").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_character_user_id").on(table.userId),
    index("idx_character_class_id").on(table.classId),
  ]
);

// Relations
export const spellsRelations = relations(spells, ({ many }) => ({
  spellClasses: many(spellClasses),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  spellClasses: many(spellClasses),
  subclasses: many(subclasses),
  classSpellSlots: many(classSpellSlots),
  characters: many(characters),
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

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  characters: many(characters),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const subclassesRelations = relations(subclasses, ({ one, many }) => ({
  class: one(classes, {
    fields: [subclasses.classId],
    references: [classes.id],
  }),
  classSpellSlots: many(classSpellSlots),
  characters: many(characters),
}));

export const classSpellSlotsRelations = relations(
  classSpellSlots,
  ({ one }) => ({
    class: one(classes, {
      fields: [classSpellSlots.classId],
      references: [classes.id],
    }),
    subclass: one(subclasses, {
      fields: [classSpellSlots.subclassId],
      references: [subclasses.id],
    }),
  })
);

export const charactersRelations = relations(characters, ({ one }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [characters.classId],
    references: [classes.id],
  }),
  subclass: one(subclasses, {
    fields: [characters.subclassId],
    references: [subclasses.id],
  }),
}));

// Types
export type Spell = typeof spells.$inferSelect;
export type NewSpell = typeof spells.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type SpellClass = typeof spellClasses.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Subclass = typeof subclasses.$inferSelect;
export type NewSubclass = typeof subclasses.$inferInsert;
export type ClassSpellSlots = typeof classSpellSlots.$inferSelect;
export type NewClassSpellSlots = typeof classSpellSlots.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
