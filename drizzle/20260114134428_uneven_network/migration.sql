PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_billing_info` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`total_kWh` integer NOT NULL,
	`balance` real NOT NULL,
	`status` text NOT NULL,
	`pay_per_kWh` real NOT NULL,
	`payment_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT `billing_info_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_billing_info`(`id`, `user_id`, `date`, `total_kWh`, `balance`, `status`, `pay_per_kWh`, `payment_id`, `created_at`, `updated_at`) SELECT `id`, `user_id`, `date`, `total_kWh`, `balance`, `status`, `pay_per_kWh`, `payment_id`, `created_at`, `updated_at` FROM `billing_info`;--> statement-breakpoint
DROP TABLE `billing_info`;--> statement-breakpoint
ALTER TABLE `__new_billing_info` RENAME TO `billing_info`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_email_verification_request` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` text NOT NULL,
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
	`expires_at` text NOT NULL,
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
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment` (
	`id` text PRIMARY KEY,
	`amount` real,
	`date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_payment`(`id`, `amount`, `date`, `created_at`, `updated_at`) SELECT `id`, `amount`, `date`, `created_at`, `updated_at` FROM `payment`;--> statement-breakpoint
DROP TABLE `payment`;--> statement-breakpoint
ALTER TABLE `__new_payment` RENAME TO `payment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY,
	`expires_at` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`two_factor_verified` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_session`(`id`, `expires_at`, `ip_address`, `user_agent`, `user_id`, `two_factor_verified`) SELECT `id`, `expires_at`, `ip_address`, `user_agent`, `user_id`, `two_factor_verified` FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sub_meter` (
	`id` text PRIMARY KEY,
	`billing_info_id` text NOT NULL,
	`sub_kWh` integer,
	`sub_reading_latest` integer,
	`sub_reading_old` integer,
	`payment_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT `sub_meter_billing_info_id_fkey` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `sub_meter_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_sub_meter`(`id`, `billing_info_id`, `sub_kWh`, `sub_reading_latest`, `sub_reading_old`, `payment_id`, `created_at`, `updated_at`) SELECT `id`, `billing_info_id`, `sub_kWh`, `sub_reading_latest`, `sub_reading_old`, `payment_id`, `created_at`, `updated_at` FROM `sub_meter`;--> statement-breakpoint
DROP TABLE `sub_meter`;--> statement-breakpoint
ALTER TABLE `__new_sub_meter` RENAME TO `sub_meter`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`github_id` integer UNIQUE,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`totp_key` blob,
	`recovery_code` blob,
	`registered_two_factor` integer DEFAULT false NOT NULL,
	`image` text,
	`password_hash` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `github_id`, `name`, `email`, `email_verified`, `totp_key`, `recovery_code`, `registered_two_factor`, `image`, `password_hash`, `created_at`, `updated_at`) SELECT `id`, `github_id`, `name`, `email`, `email_verified`, `totp_key`, `recovery_code`, `registered_two_factor`, `image`, `password_hash`, `created_at`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `billing_info_user_id_idx` ON `billing_info` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_verification_request_user_id_idx` ON `email_verification_request` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_reset_session_user_id_idx` ON `password_reset_session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_id_key` ON `payment` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_id_key` ON `session` (`id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `sub_meter_billing_info_id_idx` ON `sub_meter` (`billing_info_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);