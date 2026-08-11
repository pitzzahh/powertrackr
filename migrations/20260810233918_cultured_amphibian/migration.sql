PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tenant_reading` (
	`id` text PRIMARY KEY,
	`tenant_user_id` text NOT NULL,
	`billing_info_id` text NOT NULL,
	`reading` integer,
	`sub_kWh` integer,
	`status` text DEFAULT '' NOT NULL,
	`payment_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_tenant_reading_tenant_user_id_user_id_fk` FOREIGN KEY (`tenant_user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_tenant_reading_billing_info_id_billing_info_id_fk` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_tenant_reading_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_tenant_reading`(`id`, `tenant_user_id`, `billing_info_id`, `reading`, `sub_kWh`, `status`, `payment_id`, `created_at`, `updated_at`) SELECT `id`, `tenant_user_id`, `billing_info_id`, `reading`, `sub_kWh`, `status`, `payment_id`, `created_at`, `updated_at` FROM `tenant_reading`;--> statement-breakpoint
DROP TABLE `tenant_reading`;--> statement-breakpoint
ALTER TABLE `__new_tenant_reading` RENAME TO `tenant_reading`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_reading_tenant_billing_unique` ON `tenant_reading` (`tenant_user_id`,`billing_info_id`);--> statement-breakpoint
CREATE INDEX `tenant_reading_tenant_user_id_idx` ON `tenant_reading` (`tenant_user_id`);--> statement-breakpoint
CREATE INDEX `tenant_reading_billing_info_id_idx` ON `tenant_reading` (`billing_info_id`);--> statement-breakpoint
CREATE INDEX `tenant_reading_payment_id_idx` ON `tenant_reading` (`payment_id`);