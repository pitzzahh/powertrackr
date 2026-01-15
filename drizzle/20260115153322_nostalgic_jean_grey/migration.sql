PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_billing_info` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`total_kWh` integer NOT NULL,
	`balance` real NOT NULL,
	`status` text NOT NULL,
	`pay_per_kWh` real NOT NULL,
	`payment_id` text NOT NULL,
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
CREATE INDEX `billing_info_user_id_idx` ON `billing_info` (`user_id`);