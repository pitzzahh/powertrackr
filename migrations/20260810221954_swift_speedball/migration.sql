CREATE TABLE `tenant_reading` (
	`id` text PRIMARY KEY,
	`tenant_user_id` text NOT NULL,
	`billing_info_id` text NOT NULL,
	`reading` integer NOT NULL,
	`sub_kWh` integer NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`payment_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_tenant_reading_tenant_user_id_user_id_fk` FOREIGN KEY (`tenant_user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_tenant_reading_billing_info_id_billing_info_id_fk` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_tenant_reading_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
-- Backfill: meter_reading rows become tenant_reading rows. The tenant is the
-- meter's assigned tenant when present, else a tenant whose name matches the
-- meter label. Readings with no resolvable tenant are dropped.
INSERT INTO `tenant_reading` (`id`, `tenant_user_id`, `billing_info_id`, `reading`, `sub_kWh`, `status`, `payment_id`, `created_at`, `updated_at`)
SELECT `mr`.`id`, COALESCE(`m`.`tenant_user_id`, `t`.`id`), `mr`.`billing_info_id`, `mr`.`reading`, `mr`.`sub_kWh`, `mr`.`status`, `mr`.`payment_id`, `mr`.`created_at`, `mr`.`updated_at`
FROM `meter_reading` `mr`
JOIN `meter` `m` ON `m`.`id` = `mr`.`meter_id`
LEFT JOIN `user` `t` ON `t`.`owner_id` = `m`.`user_id` AND `t`.`name` = `m`.`label`
WHERE COALESCE(`m`.`tenant_user_id`, `t`.`id`) IS NOT NULL;--> statement-breakpoint
ALTER TABLE `reading_submission` ADD `tenant_user_id` text NOT NULL REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reading_submission` (
	`id` text PRIMARY KEY,
	`tenant_user_id` text NOT NULL,
	`reading` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_reading_submission_tenant_user_id_user_id_fk` FOREIGN KEY (`tenant_user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_reading_submission`(`id`, `tenant_user_id`, `reading`, `created_at`, `updated_at`) SELECT `id`, `submitted_by_id`, `reading`, `created_at`, `updated_at` FROM `reading_submission`;--> statement-breakpoint
DROP TABLE `reading_submission`;--> statement-breakpoint
ALTER TABLE `__new_reading_submission` RENAME TO `reading_submission`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `reading_submission_meter_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `reading_submission_submitted_by_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_user_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_parent_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_tenant_user_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_reading_meter_billing_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_reading_meter_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_reading_billing_info_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_reading_payment_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `meter_reading_submitted_by_id_idx`;--> statement-breakpoint
CREATE INDEX `reading_submission_tenant_user_id_idx` ON `reading_submission` (`tenant_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_reading_tenant_billing_unique` ON `tenant_reading` (`tenant_user_id`,`billing_info_id`);--> statement-breakpoint
CREATE INDEX `tenant_reading_tenant_user_id_idx` ON `tenant_reading` (`tenant_user_id`);--> statement-breakpoint
CREATE INDEX `tenant_reading_billing_info_id_idx` ON `tenant_reading` (`billing_info_id`);--> statement-breakpoint
CREATE INDEX `tenant_reading_payment_id_idx` ON `tenant_reading` (`payment_id`);--> statement-breakpoint
DROP TABLE `meter`;--> statement-breakpoint
DROP TABLE `meter_reading`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `allow_nested_sub_meters`;