CREATE TABLE `monsters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`trad_raw` text,
	`trad_json` text,
	`ac` varchar(255),
	`hp` varchar(255),
	`speed` varchar(255),
	`str` int,
	`dex` int,
	`con` int,
	`int` int,
	`wis` int,
	`cha` int,
	`str_mod` varchar(16),
	`dex_mod` varchar(16),
	`con_mod` varchar(16),
	`int_mod` varchar(16),
	`wis_mod` varchar(16),
	`cha_mod` varchar(16),
	`details_json` text NOT NULL,
	`sections_json` text NOT NULL,
	`description_text` text,
	`image_url` varchar(512),
	`links_json` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monsters_id` PRIMARY KEY(`id`),
	CONSTRAINT `monsters_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `user_favorite_monsters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`monster_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favorite_monsters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_favorite_monsters` ADD CONSTRAINT `user_favorite_monsters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_favorite_monsters` ADD CONSTRAINT `user_favorite_monsters_monster_id_monsters_id_fk` FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_monster_name` ON `monsters` (`name`);
--> statement-breakpoint
CREATE INDEX `idx_monster_type` ON `monsters` (`type`);
--> statement-breakpoint
CREATE INDEX `idx_favorite_user_id` ON `user_favorite_monsters` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_favorite_monster_id` ON `user_favorite_monsters` (`monster_id`);
--> statement-breakpoint
CREATE INDEX `idx_favorite_user_monster` ON `user_favorite_monsters` (`user_id`,`monster_id`);
