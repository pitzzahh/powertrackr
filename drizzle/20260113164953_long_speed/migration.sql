PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_email_verification_request` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT `fk_email_verification_request_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `email_verification_request_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_email_verification_request`(`id`, `user_id`, `email`, `code`, `expires_at`) SELECT `id`, `user_id`, `email`, `code`, `expires_at` FROM `email_verification_request`;--> statement-breakpoint
DROP TABLE `email_verification_request`;--> statement-breakpoint
ALTER TABLE `__new_email_verification_request` RENAME TO `email_verification_request`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_password_reset_session` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`two_factor_verified` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_password_reset_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `password_reset_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_password_reset_session`(`id`, `user_id`, `email`, `code`, `expires_at`, `email_verified`, `two_factor_verified`) SELECT `id`, `user_id`, `email`, `code`, `expires_at`, `email_verified`, `two_factor_verified` FROM `password_reset_session`;--> statement-breakpoint
DROP TABLE `password_reset_session`;--> statement-breakpoint
ALTER TABLE `__new_password_reset_session` RENAME TO `password_reset_session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `email_verification_request_user_id_idx` ON `email_verification_request` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_reset_session_user_id_idx` ON `password_reset_session` (`user_id`);