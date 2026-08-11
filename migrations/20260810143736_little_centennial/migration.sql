CREATE TABLE `meter` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`parent_id` text,
	`tenant_user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_meter_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_parent_id_meter_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `meter`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_tenant_user_id_user_id_fk` FOREIGN KEY (`tenant_user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `meter_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `meter`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `meter_reading` (
	`id` text PRIMARY KEY,
	`meter_id` text NOT NULL,
	`billing_info_id` text NOT NULL,
	`reading` integer NOT NULL,
	`sub_kWh` integer NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`payment_id` text NOT NULL,
	`submitted_by_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_meter_reading_meter_id_meter_id_fk` FOREIGN KEY (`meter_id`) REFERENCES `meter`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_reading_billing_info_id_billing_info_id_fk` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_reading_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_meter_reading_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `meter_reading_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `reading_submission` (
	`id` text PRIMARY KEY,
	`meter_id` text NOT NULL,
	`submitted_by_id` text NOT NULL,
	`reading` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_reading_submission_meter_id_meter_id_fk` FOREIGN KEY (`meter_id`) REFERENCES `meter`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_reading_submission_submitted_by_id_user_id_fk` FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `user` ADD `owner_id` text REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `user` ADD `allow_nested_sub_meters` integer DEFAULT false NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS `sub_meter_billing_info_id_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `sub_meter_payment_id_idx`;--> statement-breakpoint
CREATE INDEX `meter_user_id_idx` ON `meter` (`user_id`);--> statement-breakpoint
CREATE INDEX `meter_parent_id_idx` ON `meter` (`parent_id`);--> statement-breakpoint
CREATE INDEX `meter_tenant_user_id_idx` ON `meter` (`tenant_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `meter_reading_meter_billing_unique` ON `meter_reading` (`meter_id`,`billing_info_id`);--> statement-breakpoint
CREATE INDEX `meter_reading_meter_id_idx` ON `meter_reading` (`meter_id`);--> statement-breakpoint
CREATE INDEX `meter_reading_billing_info_id_idx` ON `meter_reading` (`billing_info_id`);--> statement-breakpoint
CREATE INDEX `meter_reading_payment_id_idx` ON `meter_reading` (`payment_id`);--> statement-breakpoint
CREATE INDEX `meter_reading_submitted_by_id_idx` ON `meter_reading` (`submitted_by_id`);--> statement-breakpoint
CREATE INDEX `reading_submission_meter_id_idx` ON `reading_submission` (`meter_id`);--> statement-breakpoint
CREATE INDEX `reading_submission_submitted_by_id_idx` ON `reading_submission` (`submitted_by_id`);--> statement-breakpoint
-- Backfill: one meter per (user_id, label) from existing sub_meter rows
INSERT INTO `meter` (`id`, `user_id`, `label`, `parent_id`, `tenant_user_id`, `created_at`, `updated_at`)
SELECT
  'm_' || min(sm.`id`),
  bi.`user_id`,
  sm.`label`,
  NULL,
  NULL,
  min(sm.`created_at`),
  min(sm.`updated_at`)
FROM `sub_meter` sm
JOIN `billing_info` bi ON bi.`id` = sm.`billing_info_id`
GROUP BY bi.`user_id`, sm.`label`;
--> statement-breakpoint
-- Backfill: one meter_reading per sub_meter row (dedupe same label twice in one billing period)
INSERT INTO `meter_reading` (`id`, `meter_id`, `billing_info_id`, `reading`, `sub_kWh`, `status`, `payment_id`, `submitted_by_id`, `created_at`, `updated_at`)
SELECT `id`, `meter_id`, `billing_info_id`, `reading`, `sub_kWh`, `status`, `payment_id`, NULL, `created_at`, `updated_at`
FROM (
  SELECT
    'r_' || sm.`id` AS `id`,
    'm_' || m.`first_id` AS `meter_id`,
    sm.`billing_info_id`,
    sm.`reading`,
    sm.`sub_kWh`,
    sm.`status`,
    sm.`payment_id`,
    sm.`created_at`,
    sm.`updated_at`,
    ROW_NUMBER() OVER (PARTITION BY 'm_' || m.`first_id`, sm.`billing_info_id` ORDER BY sm.`rowid`) AS `rn`
  FROM `sub_meter` sm
  JOIN `billing_info` bi ON bi.`id` = sm.`billing_info_id`
  JOIN (
    SELECT bi2.`user_id`, sm2.`label`, min(sm2.`id`) AS `first_id`
    FROM `sub_meter` sm2
    JOIN `billing_info` bi2 ON bi2.`id` = sm2.`billing_info_id`
    GROUP BY bi2.`user_id`, sm2.`label`
  ) m ON m.`user_id` = bi.`user_id` AND m.`label` = sm.`label`
) ranked
WHERE `rn` = 1;
--> statement-breakpoint
DROP TABLE `sub_meter`;
