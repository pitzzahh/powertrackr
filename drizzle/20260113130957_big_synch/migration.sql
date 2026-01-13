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
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	CONSTRAINT `billing_info_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_billing_info`(`id`, `user_id`, `date`, `total_kWh`, `balance`, `status`, `pay_per_kWh`, `payment_id`, `created_at`, `updated_at`) SELECT `id`, `user_id`, `date`, `total_kWh`, `balance`, `status`, `pay_per_kWh`, `payment_id`, `created_at`, `updated_at` FROM `billing_info`;--> statement-breakpoint
DROP TABLE `billing_info`;--> statement-breakpoint
ALTER TABLE `__new_billing_info` RENAME TO `billing_info`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment` (
	`id` text PRIMARY KEY,
	`amount` real,
	`date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_payment`(`id`, `amount`, `date`, `created_at`, `updated_at`) SELECT `id`, `amount`, `date`, `created_at`, `updated_at` FROM `payment`;--> statement-breakpoint
DROP TABLE `payment`;--> statement-breakpoint
ALTER TABLE `__new_payment` RENAME TO `payment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sub_meter` (
	`id` text PRIMARY KEY,
	`billing_info_id` text NOT NULL,
	`sub_kWh` integer,
	`sub_reading_latest` integer,
	`sub_reading_old` integer,
	`payment_id` text,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
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
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `github_id`, `name`, `email`, `email_verified`, `totp_key`, `recovery_code`, `registered_two_factor`, `image`, `password_hash`, `created_at`, `updated_at`) SELECT `id`, `github_id`, `name`, `email`, `email_verified`, `totp_key`, `recovery_code`, `registered_two_factor`, `image`, `password_hash`, `created_at`, `updated_at` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `billing_info_user_id_idx` ON `billing_info` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_id_key` ON `payment` (`id`);--> statement-breakpoint
CREATE INDEX `sub_meter_billing_info_id_idx` ON `sub_meter` (`billing_info_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);