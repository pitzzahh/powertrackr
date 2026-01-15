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
	CONSTRAINT `fk_billing_info_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_billing_info_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_billing_info`(`id`, `user_id`, `date`, `total_kWh`, `balance`, `status`, `pay_per_kWh`, `payment_id`, `created_at`, `updated_at`) SELECT `id`, `user_id`, `date`, `total_kWh`, `balance`, `status`, `pay_per_kWh`, `payment_id`, `created_at`, `updated_at` FROM `billing_info`;--> statement-breakpoint
DROP TABLE `billing_info`;--> statement-breakpoint
ALTER TABLE `__new_billing_info` RENAME TO `billing_info`;--> statement-breakpoint
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
	CONSTRAINT `fk_sub_meter_billing_info_id_billing_info_id_fk` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_sub_meter_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `sub_meter_billing_info_id_fkey` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `sub_meter_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_sub_meter`(`id`, `billing_info_id`, `sub_kWh`, `sub_reading_latest`, `sub_reading_old`, `payment_id`, `created_at`, `updated_at`) SELECT `id`, `billing_info_id`, `sub_kWh`, `sub_reading_latest`, `sub_reading_old`, `payment_id`, `created_at`, `updated_at` FROM `sub_meter`;--> statement-breakpoint
DROP TABLE `sub_meter`;--> statement-breakpoint
ALTER TABLE `__new_sub_meter` RENAME TO `sub_meter`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `billing_info_user_id_idx` ON `billing_info` (`user_id`);--> statement-breakpoint
CREATE INDEX `sub_meter_billing_info_id_idx` ON `sub_meter` (`billing_info_id`);--> statement-breakpoint
CREATE INDEX `sub_meter_payment_id_idx` ON `sub_meter` (`payment_id`);