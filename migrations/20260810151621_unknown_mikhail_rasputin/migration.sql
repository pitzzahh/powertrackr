PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meter` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`parent_id` text,
	`tenant_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_meter_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_parent_id_meter_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `meter`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_tenant_user_id_user_id_fk` FOREIGN KEY (`tenant_user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_meter`(`id`, `user_id`, `label`, `parent_id`, `tenant_user_id`, `created_at`, `updated_at`) SELECT `id`, `user_id`, `label`, `parent_id`, `tenant_user_id`, `created_at`, `updated_at` FROM `meter`;--> statement-breakpoint
DROP TABLE `meter`;--> statement-breakpoint
ALTER TABLE `__new_meter` RENAME TO `meter`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `meter_user_id_idx` ON `meter` (`user_id`);--> statement-breakpoint
CREATE INDEX `meter_parent_id_idx` ON `meter` (`parent_id`);--> statement-breakpoint
CREATE INDEX `meter_tenant_user_id_idx` ON `meter` (`tenant_user_id`);