CREATE TABLE `characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`class_id` int NOT NULL,
	`subclass_id` int,
	`level` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `characters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_spell_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`subclass_id` int,
	`character_level` int NOT NULL,
	`slot_level_1` int NOT NULL DEFAULT 0,
	`slot_level_2` int NOT NULL DEFAULT 0,
	`slot_level_3` int NOT NULL DEFAULT 0,
	`slot_level_4` int NOT NULL DEFAULT 0,
	`slot_level_5` int NOT NULL DEFAULT 0,
	`slot_level_6` int NOT NULL DEFAULT 0,
	`slot_level_7` int NOT NULL DEFAULT 0,
	`slot_level_8` int NOT NULL DEFAULT 0,
	`slot_level_9` int NOT NULL DEFAULT 0,
	CONSTRAINT `class_spell_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subclasses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`nom` varchar(100) NOT NULL,
	`nom_affich` varchar(100) NOT NULL,
	CONSTRAINT `subclasses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`display_name` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `characters` ADD CONSTRAINT `characters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `characters` ADD CONSTRAINT `characters_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `characters` ADD CONSTRAINT `characters_subclass_id_subclasses_id_fk` FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_spell_slots` ADD CONSTRAINT `class_spell_slots_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_spell_slots` ADD CONSTRAINT `class_spell_slots_subclass_id_subclasses_id_fk` FOREIGN KEY (`subclass_id`) REFERENCES `subclasses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subclasses` ADD CONSTRAINT `subclasses_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_character_user_id` ON `characters` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_character_class_id` ON `characters` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_slots_class_id` ON `class_spell_slots` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_slots_subclass_id` ON `class_spell_slots` (`subclass_id`);--> statement-breakpoint
CREATE INDEX `idx_slots_character_level` ON `class_spell_slots` (`character_level`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_subclass_class_id` ON `subclasses` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_subclass_nom` ON `subclasses` (`nom`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `users` (`email`);