PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`github_id` integer,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`totp_key` text,
	`recovery_code` text,
	`registered_two_factor` integer DEFAULT false NOT NULL,
	`image` text,
	`password_hash` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `github_id`, `name`, `email`, `email_verified`, `totp_key`, `recovery_code`, `registered_two_factor`, `image`, `password_hash`, `created_at`, `updated_at`) SELECT `id`, `github_id`, `name`, `email`, `email_verified`, `totp_key`, `recovery_code`, `registered_two_factor`, `image`, `password_hash`, `created_at`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_github_id_key` ON `user` (`github_id`);