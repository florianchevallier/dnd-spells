CREATE TABLE `character_prepared_spells` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` int NOT NULL,
	`spell_id` int NOT NULL,
	`prepared_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `character_prepared_spells_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `character_prepared_spells` ADD CONSTRAINT `character_prepared_spells_character_id_characters_id_fk` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `character_prepared_spells` ADD CONSTRAINT `character_prepared_spells_spell_id_spells_id_fk` FOREIGN KEY (`spell_id`) REFERENCES `spells`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_prepared_character_id` ON `character_prepared_spells` (`character_id`);--> statement-breakpoint
CREATE INDEX `idx_prepared_character_spell` ON `character_prepared_spells` (`character_id`,`spell_id`);