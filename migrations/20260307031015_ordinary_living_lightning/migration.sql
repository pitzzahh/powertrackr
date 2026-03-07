CREATE TABLE `billing_info` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`date` integer NOT NULL,
	`total_kWh` integer NOT NULL,
	`balance` real NOT NULL,
	`status` text NOT NULL,
	`pay_per_kWh` real NOT NULL,
	`payment_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_billing_info_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_billing_info_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `email_verification_request` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT `fk_email_verification_request_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `password_reset_session` (
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
CREATE TABLE `payment` (
	`id` text PRIMARY KEY,
	`amount` real NOT NULL,
	`date` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`two_factor_verified` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sub_meter` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`billing_info_id` text NOT NULL,
	`sub_kWh` integer NOT NULL,
	`reading` integer NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`payment_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_sub_meter_billing_info_id_billing_info_id_fk` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_sub_meter_payment_id_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `sub_meter_billing_info_id_fkey` FOREIGN KEY (`billing_info_id`) REFERENCES `billing_info`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `sub_meter_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`github_id` integer,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`totp_key` blob,
	`recovery_code` blob,
	`registered_two_factor` integer DEFAULT false NOT NULL,
	`image` text,
	`password_hash` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `billing_info_user_id_idx` ON `billing_info` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_verification_request_user_id_idx` ON `email_verification_request` (`user_id`);--> statement-breakpoint
CREATE INDEX `password_reset_session_user_id_idx` ON `password_reset_session` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `sub_meter_billing_info_id_idx` ON `sub_meter` (`billing_info_id`);--> statement-breakpoint
CREATE INDEX `sub_meter_payment_id_idx` ON `sub_meter` (`payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_github_id_key` ON `user` (`github_id`);