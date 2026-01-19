CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(50) NOT NULL,
	`nom_affich` varchar(50) NOT NULL,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_nom_unique` UNIQUE(`nom`)
);
--> statement-breakpoint
CREATE TABLE `spell_classes` (
	`spell_id` int NOT NULL,
	`class_id` int NOT NULL,
	CONSTRAINT `spell_classes_spell_id_class_id_pk` PRIMARY KEY(`spell_id`,`class_id`)
);
--> statement-breakpoint
CREATE TABLE `spells` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(255) NOT NULL,
	`niveau` int NOT NULL DEFAULT 0,
	`ecole` varchar(50) NOT NULL,
	`rituel` boolean NOT NULL DEFAULT false,
	`concentration` boolean NOT NULL DEFAULT false,
	`temps_valeur` int,
	`temps_unite` varchar(50),
	`temps_condition` text,
	`portee_type` varchar(50),
	`portee_valeur` int,
	`portee_unite` varchar(50),
	`portee_forme` varchar(50),
	`duree_type` varchar(50),
	`duree_valeur` int,
	`duree_unite` varchar(50),
	`composantes` varchar(20),
	`materiaux` text,
	`niv_1` varchar(50),
	`niv_2` varchar(50),
	`niv_3` varchar(50),
	`niv_4` varchar(50),
	`niv_5` varchar(50),
	`niv_6` varchar(50),
	`niv_7` varchar(50),
	`niv_8` varchar(50),
	`niv_9` varchar(50),
	`source` varchar(100),
	`description` text,
	`niveaux_sup_txt` text,
	CONSTRAINT `spells_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `spell_classes` ADD CONSTRAINT `spell_classes_spell_id_spells_id_fk` FOREIGN KEY (`spell_id`) REFERENCES `spells`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `spell_classes` ADD CONSTRAINT `spell_classes_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_spell_id` ON `spell_classes` (`spell_id`);--> statement-breakpoint
CREATE INDEX `idx_class_id` ON `spell_classes` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_niveau` ON `spells` (`niveau`);--> statement-breakpoint
CREATE INDEX `idx_ecole` ON `spells` (`ecole`);--> statement-breakpoint
CREATE INDEX `idx_niveau_ecole` ON `spells` (`niveau`,`ecole`);